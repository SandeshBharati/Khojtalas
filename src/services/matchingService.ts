import { ref, push, set, get, query as rtdbQuery, orderByChild, equalTo, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { GoogleGenAI } from '@google/genai';
import { sendEmail } from './emailService';

const MATCH_THRESHOLD = 95; // minimum score to consider a match

function buildPrompt(lostItem: any, foundItem: any): string {
  return `
You are an AI matching engine for a lost and found platform.
Compare the following lost item description with the found item description and return a match percentage (0-100).
Consider details like color, serial number, brand, location, and time.

Lost Item:
Category: ${lostItem.category}
Brand: ${lostItem.brand || 'N/A'}
Model: ${lostItem.model || 'N/A'}
Color: ${lostItem.color || 'N/A'}
Name: ${lostItem.name || 'N/A'}
Age: ${lostItem.age || 'N/A'}
Gender: ${lostItem.gender || 'N/A'}
Breed: ${lostItem.breed || 'N/A'}
Size: ${lostItem.size || 'N/A'}
Material: ${lostItem.material || 'N/A'}
Document Type: ${lostItem.documentType || 'N/A'}
OS: ${lostItem.os || 'N/A'}
Storage: ${lostItem.storage || 'N/A'}
Height: ${lostItem.height || 'N/A'}
Wearing: ${lostItem.lastSeenWearing || 'N/A'}
Microchip ID: ${lostItem.microchipId || 'N/A'}
Collar Color: ${lostItem.collarColor || 'N/A'}
Contents: ${lostItem.contents || 'N/A'}
Jewelry Weight: ${lostItem.jewelryWeight || 'N/A'}
Vehicle Type: ${lostItem.vehicleType || 'N/A'}
License Plate: ${lostItem.licensePlate || 'N/A'}
VIN: ${lostItem.vin || 'N/A'}
Instrument Type: ${lostItem.instrumentType || 'N/A'}
Serial Number: ${lostItem.serialNumber || 'N/A'}
Eyewear Type: ${lostItem.eyewearType || 'N/A'}
Frame Color: ${lostItem.frameColor || 'N/A'}
Lens Color: ${lostItem.lensColor || 'N/A'}
Description: ${lostItem.description}
District: ${lostItem.district || 'N/A'}
City: ${lostItem.city || 'N/A'}
Location From (Lat, Lng): ${lostItem.locationFromLat}, ${lostItem.locationFromLng}
Location To (Lat, Lng): ${lostItem.locationToLat || 'N/A'}, ${lostItem.locationToLng || 'N/A'}
Time Range: ${lostItem.timeFrom} to ${lostItem.timeTo || 'N/A'}

Found Item:
Category: ${foundItem.category}
Brand: ${foundItem.brand || 'N/A'}
Model: ${foundItem.model || 'N/A'}
Color: ${foundItem.color || 'N/A'}
Name: ${foundItem.name || 'N/A'}
Age: ${foundItem.age || 'N/A'}
Gender: ${foundItem.gender || 'N/A'}
Breed: ${foundItem.breed || 'N/A'}
Size: ${foundItem.size || 'N/A'}
Material: ${foundItem.material || 'N/A'}
Document Type: ${foundItem.documentType || 'N/A'}
OS: ${foundItem.os || 'N/A'}
Storage: ${foundItem.storage || 'N/A'}
Height: ${foundItem.height || 'N/A'}
Wearing: ${foundItem.lastSeenWearing || 'N/A'}
Microchip ID: ${foundItem.microchipId || 'N/A'}
Collar Color: ${foundItem.collarColor || 'N/A'}
Contents: ${foundItem.contents || 'N/A'}
Jewelry Weight: ${foundItem.jewelryWeight || 'N/A'}
Vehicle Type: ${foundItem.vehicleType || 'N/A'}
License Plate: ${foundItem.licensePlate || 'N/A'}
VIN: ${foundItem.vin || 'N/A'}
Instrument Type: ${foundItem.instrumentType || 'N/A'}
Serial Number: ${foundItem.serialNumber || 'N/A'}
Eyewear Type: ${foundItem.eyewearType || 'N/A'}
Frame Color: ${foundItem.frameColor || 'N/A'}
Lens Color: ${foundItem.lensColor || 'N/A'}
Description: ${foundItem.description}
District: ${foundItem.district || 'N/A'}
City: ${foundItem.city || 'N/A'}
Location Found (Lat, Lng): ${foundItem.locationFromLat}, ${foundItem.locationFromLng}
Location Description: ${foundItem.foundLocationDescription || 'N/A'}
Time Found: ${foundItem.timeFrom}

Return ONLY a JSON object with a "score" property (number between 0 and 100).
  `;
}

function buildInlineDataParts(item: any): any[] {
  const parts: any[] = [];
  for (const field of ['photoData', 'videoData']) {
    const value = item[field];
    if (!value || typeof value !== 'string' || !value.includes(',')) continue;
    try {
      const mimeType = value.split(';')[0].split(':')[1];
      const data = value.split(',')[1];
      if (mimeType && data) {
        parts.push({ inlineData: { mimeType, data } });
      }
    } catch {
      // skip unparseable media
    }
  }
  return parts;
}

async function createMatchAndNotify(
  lostItem: any,
  foundItemId: string,
  score: number
) {
  const matchRef = push(ref(db, 'matches'));
  await set(matchRef, {
    lostItemId: lostItem.id,
    foundItemId,
    matchScore: score,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  const matchId = matchRef.key!;

  // In-app notification for the lost-item owner
  const notifRef1 = push(ref(db, 'notifications'));
  await set(notifRef1, {
    userId: lostItem.userId,
    message: `Good news! We found a potential match (${score}%) for your lost ${lostItem.category}.`,
    read: false,
    type: 'match_found',
    matchId,
    createdAt: serverTimestamp(),
  });

  // In-app notification for the found-item reporter
  const foundSnap = await get(ref(db, `items/${foundItemId}`));
  if (foundSnap.exists()) {
    const foundData = foundSnap.val();
    const notifRef2 = push(ref(db, 'notifications'));
    await set(notifRef2, {
      userId: foundData.userId,
      message: `Your found ${foundData.category} matched a lost item report (${score}%).`,
      read: false,
      type: 'match_found',
      matchId,
      createdAt: serverTimestamp(),
    });
  }

  console.log(`Match created — Lost: ${lostItem.id}, Found: ${foundItemId}, Score: ${score}`);

  // Send email to the lost-item owner
  if (lostItem.contactEmail) {
    sendEmail(
      lostItem.contactEmail,
      'KhojTalas — A potential match was found!',
      `Hi ${lostItem.contactName || ''},\n\nGreat news! We found a potential match (${score}%) for your lost ${lostItem.category}. Log in to KhojTalas to review the match and connect with the finder.\n\n— KhojTalas Team`
    ).catch(console.error);
  }

  return matchId;
}

/**
 * Compare a single found item against all approved lost items in the same category.
 */
export async function matchFoundItem(foundItemId: string, foundItem: any): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set — skipping matching');
    return;
  }

  try {
    // RTDB: query by category, then filter by type and status in JS
    const q = rtdbQuery(
      ref(db, 'items'),
      orderByChild('category'),
      equalTo(foundItem.category)
    );

    const snapshot = await get(q);
    const lostItems: any[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.type === 'lost' && data.status === 'approved') {
        lostItems.push({ id: child.key!, ...data });
      }
    });
    if (lostItems.length === 0) return;

    const ai = new GoogleGenAI({ apiKey });

    for (const lostItem of lostItems) {
      try {
        const parts: any[] = [
          { text: buildPrompt(lostItem, foundItem) },
          ...buildInlineDataParts(lostItem),
          ...buildInlineDataParts(foundItem),
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: parts,
          config: { responseMimeType: 'application/json' },
        });

        const resultText = response.text;
        if (resultText) {
          const { score } = JSON.parse(resultText);
          if (typeof score === 'number' && score >= MATCH_THRESHOLD) {
            await createMatchAndNotify(lostItem, foundItemId, score);
          }
        }
      } catch (aiError) {
        console.error('AI matching error for lost item', lostItem.id, aiError);
      }
    }
  } catch (error) {
    console.error('matchFoundItem error:', error);
  }
}

/**
 * Compare a single lost item against all approved found items in the same category.
 * Called when the admin approves a lost item.
 */
export async function matchLostItem(lostItemId: string, lostItem: any): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set — skipping matching');
    return;
  }

  try {
    // RTDB: query by category, then filter by type and status in JS
    const q = rtdbQuery(
      ref(db, 'items'),
      orderByChild('category'),
      equalTo(lostItem.category)
    );

    const snapshot = await get(q);
    const foundItems: any[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.type === 'found' && data.status === 'approved') {
        foundItems.push({ id: child.key!, ...data });
      }
    });
    if (foundItems.length === 0) return;

    const ai = new GoogleGenAI({ apiKey });

    for (const foundItem of foundItems) {
      try {
        const parts: any[] = [
          { text: buildPrompt(lostItem, foundItem) },
          ...buildInlineDataParts(lostItem),
          ...buildInlineDataParts(foundItem),
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: parts,
          config: { responseMimeType: 'application/json' },
        });

        const resultText = response.text;
        if (resultText) {
          const { score } = JSON.parse(resultText);
          if (typeof score === 'number' && score >= MATCH_THRESHOLD) {
            await createMatchAndNotify(lostItem, foundItem.id, score);
          }
        }
      } catch (aiError) {
        console.error('AI matching error for found item', foundItem.id, aiError);
      }
    }
  } catch (error) {
    console.error('matchLostItem error:', error);
  }
}
