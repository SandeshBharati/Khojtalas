# KhojTalas — Project Documentation

**Version:** 1.0.0  
**Last Updated:** April 7, 2026  
**Platform:** Web Application  
**Domain:** Lost & Found — Nepal

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Frontend Application](#5-frontend-application)
   - 5.1 [Routing & Navigation](#51-routing--navigation)
   - 5.2 [Authentication](#52-authentication)
   - 5.3 [Report Lost Items](#53-report-lost-items)
   - 5.4 [Report Found Items](#54-report-found-items)
   - 5.5 [Browse & Search](#55-browse--search)
   - 5.6 [Item Details](#56-item-details)
   - 5.7 [User Panel](#57-user-panel)
   - 5.8 [Notifications](#58-notifications)
   - 5.9 [Match Detail Page](#59-match-detail-page)
   - 5.10 [Admin Panel](#510-admin-panel)
6. [Backend Application](#6-backend-application)
   - 6.1 [FastAPI Server](#61-fastapi-server)
   - 6.2 [API Endpoints](#62-api-endpoints)
   - 6.3 [Celery Task Queue](#63-celery-task-queue)
7. [Smart Matching Algorithm](#7-smart-matching-algorithm)
   - 7.1 [Text Similarity](#71-text-similarity)
   - 7.2 [Image Similarity](#72-image-similarity)
   - 7.3 [Location Scoring](#73-location-scoring)
   - 7.4 [Time Scoring](#74-time-scoring)
   - 7.5 [Composite Score & Threshold](#75-composite-score--threshold)
8. [Data Models & Firebase Structure](#8-data-models--firebase-structure)
   - 8.1 [Users Collection](#81-users-collection)
   - 8.2 [Items Collection](#82-items-collection)
   - 8.3 [Matches Collection](#83-matches-collection)
   - 8.4 [Notifications Collection](#84-notifications-collection)
9. [Security & Access Control](#9-security--access-control)
10. [Email & Notification System](#10-email--notification-system)
11. [Geographic Coverage](#11-geographic-coverage)
12. [User Workflows](#12-user-workflows)
13. [Deployment & Configuration](#13-deployment--configuration)
14. [Environment Variables](#14-environment-variables)
15. [Project Directory Structure](#15-project-directory-structure)

---

## 1. Introduction

**KhojTalas** (Nepali: "search for it") is a Nepal-focused lost and found web platform designed to reunite people with their lost belongings. The platform allows users to report lost or found items, and uses an AI-powered multi-factor matching algorithm to intelligently match lost items with found items across all 77 districts of Nepal.

### Key Highlights

- **AI-Powered Matching** — Combines text NLP, perceptual image hashing, geolocation distance, and time-window analysis to produce high-confidence matches.
- **Nationwide Coverage** — Supports all 77 districts and 400+ municipalities of Nepal with cascading location selectors.
- **Real-Time Notifications** — WebSocket-based instant notifications plus email alerts when a match is found.
- **Admin Moderation** — Every reported item goes through an admin review process before becoming publicly visible.
- **Category-Specific Forms** — Dynamic fields tailored to 12+ item categories (electronics, pets, persons, vehicles, etc.).
- **Multi-Factor Authentication** — Firebase Auth with Google, GitHub, and Facebook social login, plus optional TOTP MFA.

---

## 2. System Overview

KhojTalas follows a decoupled architecture with a React frontend and a Python FastAPI backend, unified through Firebase Realtime Database as the primary data store.

```
┌─────────────────────────────────────────────────────┐
│                    End Users                        │
│              (Browsers / Mobile)                    │
└────────────┬───────────────────────┬────────────────┘
             │                       │
             ▼                       ▼
┌────────────────────┐   ┌───────────────────────────┐
│   React Frontend   │   │   Admin Dashboard         │
│   (Vite + TS)      │   │   (Separate Vite Build)   │
│   Port 3000        │   │   Port 4000               │
└────────┬───────────┘   └────────┬──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              Firebase Realtime Database              │
│              Firebase Auth                           │
│              Firebase Storage                        │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                │
│              Uvicorn ASGI Server                     │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Celery Task Queue                       │
│              Redis Broker                            │
│  ┌─────────────────┐  ┌──────────────────────┐      │
│  │  match_tasks     │  │  email_tasks          │     │
│  │  (AI matching)   │  │  (SMTP emails)        │     │
│  └─────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend

| Technology        | Purpose                          |
|-------------------|----------------------------------|
| React 19          | UI framework                     |
| TypeScript 5.8    | Type-safe development            |
| Vite 6            | Build tool & dev server          |
| Tailwind CSS 4    | Utility-first styling            |
| React Router 7    | Client-side routing              |
| Firebase SDK 12   | Auth, Realtime DB, Storage       |
| Leaflet           | Interactive maps                 |
| React-Leaflet 5   | React bindings for Leaflet       |
| Lucide React      | Icon library                     |
| Sonner            | Toast notifications              |
| Motion            | Animations                       |
| date-fns          | Date formatting & manipulation   |
| Google GenAI SDK  | Gemini API for AI matching       |

### Backend

| Technology              | Purpose                          |
|-------------------------|----------------------------------|
| Python 3.x             | Backend runtime                  |
| FastAPI                 | REST API framework               |
| Uvicorn                 | ASGI server                      |
| Celery + Redis          | Async task queue                 |
| Firebase Admin SDK      | Server-side Firebase access      |
| Sentence Transformers   | Text embedding (all-MiniLM-L6-v2)|
| Pillow + ImageHash      | Perceptual image hashing         |
| scikit-learn            | Cosine similarity computation    |
| python-jose             | JWT token handling               |

### Infrastructure

| Service           | Purpose                          |
|-------------------|----------------------------------|
| Firebase RTDB     | Primary data store               |
| Firebase Auth     | User authentication              |
| Firebase Storage  | File/media storage               |
| Redis             | Celery message broker            |
| Vercel            | Frontend hosting                 |
| SMTP (Gmail)      | Transactional emails             |
| EmailJS           | Client-side email sending        |

---

## 4. System Architecture

### Data Flow

1. **User submits a report** → Data is written to Firebase RTDB with status `pending`.
2. **Admin reviews** → Approves or rejects the item in the admin dashboard.
3. **On approval** → A Celery task is dispatched to the backend.
4. **Matching pipeline** → The backend compares the newly approved item against all approved items of the opposite type (lost vs. found) in the same category.
5. **Match found (≥95%)** → A match record is created in Firebase, a notification is pushed to the item owner, and an email is sent.
6. **User reviews match** → Views the side-by-side comparison and can mark the item as resolved.

### Communication Patterns

- **Frontend ↔ Firebase**: Direct SDK calls (no REST API needed for CRUD).
- **Frontend ↔ Backend**: REST API calls for triggering matching, fetching match details.
- **Backend ↔ Firebase**: Firebase Admin SDK for server-side data access.
- **Backend ↔ Celery/Redis**: Async task dispatch and result tracking.
- **Backend → User**: WebSocket notifications and SMTP emails.

---

## 5. Frontend Application

### 5.1 Routing & Navigation

The application uses React Router v7 with the following route structure:

| Route                 | Page Component      | Access Level    | Description                       |
|-----------------------|---------------------|-----------------|-----------------------------------|
| `/`                   | Home                | Public          | Landing page with hero, features, stats |
| `/login`              | Login               | Public          | Email/password + social auth login |
| `/register`           | Register            | Public          | New account registration          |
| `/report-lost`        | ReportLost          | Authenticated   | Multi-step lost item form         |
| `/report-found`       | ReportFound         | Authenticated   | Multi-step found item form        |
| `/edit-item/:id`      | EditItem            | Owner/Admin     | Edit existing item                |
| `/browse`             | Browse              | Public          | Search & filter all reports       |
| `/item/:id`           | ItemDetails         | Public*         | Item detail view (* pending = private) |
| `/user`               | UserPanel           | Authenticated   | User dashboard & settings         |
| `/notifications`      | NotificationsPage   | Authenticated   | Notification list & filters       |
| `/matches/:id`        | MatchDetailPage     | Authenticated   | Side-by-side match comparison     |
| `/admin`              | AdminDashboard      | Admin only      | Admin overview & quick actions    |
| `/admin/pending`      | ReviewQueuePage     | Admin only      | Item approval/rejection queue     |
| `/admin/matches`      | AdminMatchesPage    | Admin only      | All system matches                |
| `/admin/users`        | AdminUsersPage      | Admin only      | User management                   |
| `/terms`              | TermsOfService      | Public          | Terms of service                  |
| `/privacy`            | PrivacyPolicy       | Public          | Privacy policy                    |
| `/cookies`            | CookiePolicy        | Public          | Cookie policy                     |
| `/faq`                | FAQ                 | Public          | Frequently asked questions        |
| `/about`              | AboutUs             | Public          | About the platform                |

### 5.2 Authentication

Authentication is managed through Firebase Auth with the `AuthContext` provider wrapping the entire application.

**Supported Authentication Methods:**
- Email and password (primary)
- Google OAuth
- GitHub OAuth
- Facebook OAuth
- TOTP-based Multi-Factor Authentication (optional)

**User Profile Structure:**
Upon registration or first social login, a user profile is created in Firebase RTDB at `users/{uid}` with fields: `uid`, `email`, `name`, `phone`, `avatarUrl`, `role` (default: `user`), and notification preferences.

**Admin Auto-Upgrade:**
Users whose email addresses appear in the `ADMIN_EMAILS` environment variable are automatically promoted to the `admin` role upon sign-in.

**Phone Validation:**
Nepal phone numbers are validated with the regex pattern `^(98|97)\d{8}$` (10 digits starting with 98 or 97).

### 5.3 Report Lost Items

The "Report Lost" page presents a **4-step form** with a visual progress stepper:

**Step 1 — Category Selection**

Users choose from 12+ categories, each represented by an emoji icon:

| Category           | Icon | Category-Specific Fields                                     |
|--------------------|------|--------------------------------------------------------------|
| Electronics        | 📱   | Brand, model, color, OS, storage capacity                    |
| Wallet / Money     | 👛   | Document type, contents, cardholder name                     |
| Person             | 👤   | Name, age, gender, height, last seen wearing                 |
| Pets               | 🐾   | Name, breed, color, microchip ID, collar color               |
| Jewelry            | 💍   | Material, weight, brand                                      |
| Keys               | 🔑   | Number of keys, key type, keychain description, color        |
| Vehicles           | 🚗   | Vehicle type, license plate, VIN, color                      |
| Clothing           | 👕   | Brand, size, color                                           |
| Musical Instruments| 🎸   | Instrument type, serial number                               |
| Glasses            | 👓   | Eyewear type, frame color, lens color                        |
| Bags               | 🎒   | Brand, color, contents                                       |
| Other              | 📦   | General description fields                                   |

**Step 2 — Item Details**

Dynamic fields based on the selected category, plus universal fields:
- Description (free text, required)
- Primary and secondary color
- Distinguishing features

**Step 3 — Location & Time**

- **Map Picker**: Interactive Leaflet map to pin the "from" and optionally "to" location (for routes/journeys).
- **District & City**: Cascading dropdowns covering all 77 districts.
- **Location Description**: Free-text description of the location.
- **Time Range**: Date-time picker for "from" and "to" defining when the item was lost.

**Step 4 — Contact & Media**

- Contact name, email, phone
- Photo upload (max 250 KB, stored as Base64)
- Video upload (max 400 KB, stored as Base64)
- Police report filed (yes/no) with optional report number
- Estimated value (for reward offering)

Upon submission, the item is saved to Firebase RTDB with status `pending`.

### 5.4 Report Found Items

Similar to the lost item form with these differences:
- **Single time picker** (when found) instead of a time range.
- **Single location point** instead of a from/to route.
- **Video upload is mandatory** (to verify the finder has the item).
- Triggers the matching pipeline immediately upon admin approval.

### 5.5 Browse & Search

The Browse page allows users to discover all approved reports with:

**Filters:**
- Report type: Lost / Found / All
- Category dropdown
- District & city location filter
- Date range
- Free-text search (searches across description, category, brand, model)

**Layout:**
- Desktop: Sidebar filter panel + main content area with item cards
- Mobile: Collapsible filter section
- Item cards display: photo thumbnail, title, type badge (red=lost, green=found), district, date, status

### 5.6 Item Details

The item detail page shows comprehensive information:

- **Media Display**: Large photo/video player on dark background
- **Type Badge**: Red for lost, green for found
- **Location**: Embedded Leaflet map with pin + text description
- **Time Information**: When lost/found with human-readable formatting
- **Category-Specific Fields**: All relevant fields for the item's category
- **Contact**: Option to view the reporter's contact information
- **Similar Items**: Carousel of items in the same category/area
- **Actions**: Share button, contact finder/reporter button

**Access Control:**
- Approved and resolved items: visible to everyone
- Pending items: visible only to the owner and admins

### 5.7 User Panel

A tabbed dashboard for authenticated users:

**Profile Tab**
- Edit display name, phone number, avatar photo
- Phone validation for Nepal numbers

**Security Tab**
- Change password (requirements: 8+ chars, 1 uppercase, 1 number, 1 special character)
- TOTP MFA enrollment with QR code and backup codes
- Active sessions overview

**Items Tab**
- My Lost Items: list with status badges, edit/delete actions
- My Found Items: list with status badges, edit/delete actions

**Notifications Tab**
- Toggle: Email on item approval
- Toggle: Email on match found
- Toggle: In-app notifications

**Danger Zone**
- Account deletion with OTP verification
- Confirmation dialog for irreversible action

### 5.8 Notifications

**Notification Bell (Header):**
- Badge showing unread notification count
- Dropdown showing recent notifications
- Click to navigate to full notifications page

**Notifications Page:**
- Filter tabs: All, Matches, Approvals, General
- Each notification shows: icon by type, message, relative timestamp ("2 days ago"), read/unread indicator
- "Mark all as read" bulk action
- Match notifications link to `/matches/{matchId}`

**Notification Types:**

| Type             | Trigger                        | Content                         |
|------------------|--------------------------------|---------------------------------|
| `match_found`    | AI match score ≥ 95%           | "A possible match was found!" + link |
| `item_approved`  | Admin approves item            | "Your item has been approved"   |
| `item_rejected`  | Admin rejects item             | "Your item was rejected" + reason |
| `system`         | System announcements           | Variable content                |

**Real-Time Delivery:**
- The `useNotifications` hook sets up a real-time Firebase listener on the notifications collection filtered by `userId`.
- New notifications trigger a toast (via Sonner) automatically.

### 5.9 Match Detail Page

A side-by-side comparison view for reviewing a potential match:

**Left Panel — Lost Item:**
- Photo/video
- Title and category
- Location route (from → to) on map
- Time window
- Additional details

**Right Panel — Found Item:**
- Photo/video
- Title and category
- Found location on map
- Found time
- Finder information

**Match Score Display:**

| Score Component   | Description                    | Weight |
|-------------------|--------------------------------|--------|
| Text Score        | NLP similarity of descriptions | Shown  |
| Image Score       | Perceptual hash comparison     | Shown  |
| Location Score    | Haversine distance score       | Shown  |
| Time Score        | Time window overlap score      | Shown  |
| **Total Score**   | **Composite score**            | **Highlighted** |

**Color-Coded Badges:**
- ≥ 97%: Green — "Excellent match"
- 95–97%: Orange — "Strong match"

**Actions:**
- "Mark as Resolved" — Confirms the match and sets both items to `resolved` status
- "Back to Notifications" — Returns to the notification list

### 5.10 Admin Panel

#### Admin Dashboard (`/admin`)

Overview cards showing:
- Pending items count (highlighted in orange)
- Approved today count
- Rejected today count
- Total items count

Quick actions panel showing the 5 most recent pending items with inline approve/reject buttons.

#### Review Queue (`/admin/pending`)

Full review interface with:
- Text search across description, category, brand
- Category filter tabs: All, Electronics, Wallet/Money, Documents, Jewelry, Clothing, Vehicle, Other
- Item cards showing: photo, title, category badge, district/city, time, user ID, submission date
- **Approve button** (green): Immediately approves, sets status to `approved`, triggers matching pipeline
- **Reject button** (red): Opens a dialog requiring a rejection reason, creates a notification to the user

#### Admin Matches (`/admin/matches`)

Table displaying all system matches:
- Match ID (truncated)
- Lost item title (clickable)
- Found item title (clickable)
- Match score with color coding
- Status badge (pending/resolved)
- Creation date
- View match detail link

#### Admin Users (`/admin/users`)

User management table:
- Avatar, name, email
- Role badge (admin/user)
- Status badge (active/deactivated)
- Joined date
- Deactivate button (disabled for admin users)

---

## 6. Backend Application

### 6.1 FastAPI Server

The backend is a Python FastAPI application served by Uvicorn.

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── celery_app.py            # Celery configuration
│   ├── firebase_admin_init.py   # Firebase Admin SDK setup
│   ├── Procfile                 # Process manager config
│   ├── requirements.txt         # Python dependencies
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── found_items.py   # Found items & matches endpoints
│   │       └── notifications.py # Notifications & WebSocket
│   └── services/
│       ├── __init__.py
│       ├── matching_service.py  # AI matching algorithm
│       └── tasks/
│           ├── __init__.py
│           ├── email_tasks.py   # Email sending Celery tasks
│           └── match_tasks.py   # Matching pipeline Celery tasks
├── requirements.txt
├── runtime.txt
└── serviceAccountKey.json
```

**CORS Configuration:**
The server allows cross-origin requests from configured frontend origins (defined via `CORS_ORIGINS` env var).

### 6.2 API Endpoints

#### Found Items & Matches

| Method  | Endpoint                              | Description                          |
|---------|---------------------------------------|--------------------------------------|
| POST    | `/api/v1/found-items`                 | Save a found item and trigger matching |
| GET     | `/api/v1/matches/{match_id}`          | Get match details with scores        |
| GET     | `/api/v1/matches/my-matches?user_id=` | Get all matches for a user's lost items |
| PATCH   | `/api/v1/lost-items/{item_id}/resolve`| Mark a lost item as resolved         |

#### Notifications

| Method    | Endpoint                                      | Description                     |
|-----------|-----------------------------------------------|---------------------------------|
| WebSocket | `/ws/{user_id}?token={token}`                 | Real-time notification stream   |
| GET       | `/api/v1/notifications?user_id=&page=&size=&type=` | Paginated notification list |

#### Health

| Method | Endpoint   | Description        |
|--------|------------|--------------------|
| GET    | `/health`  | Health check       |

### 6.3 Celery Task Queue

Celery is configured with Redis as the message broker for handling asynchronous, compute-intensive tasks.

**Configuration:**
- Broker: Redis (`redis://localhost:6379/0`)
- Serialization: JSON
- Timezone: UTC
- Late acknowledgment enabled (tasks are re-queued on worker crash)
- Prefetch multiplier: 1 (fair scheduling)
- Max retries: 3 with 60-second backoff

**Registered Tasks:**

| Task                  | Module                              | Purpose                         |
|-----------------------|-------------------------------------|---------------------------------|
| `run_matching`        | `app.services.tasks.match_tasks`    | Full matching pipeline          |
| `send_match_email`    | `app.services.tasks.email_tasks`    | Send match notification email   |

---

## 7. Smart Matching Algorithm

The core innovation of KhojTalas is its multi-factor matching algorithm. When a found item is approved, the system compares it against all approved lost items in the same category using four independent scoring dimensions.

### 7.1 Text Similarity

**Model:** `all-MiniLM-L6-v2` (Sentence Transformers)

- Generates 384-dimensional text embeddings from item descriptions and metadata.
- Embeddings are computed on-demand and cached in Firebase (`text_embedding` field).
- Similarity is measured using **cosine similarity** (0.0 to 1.0).
- Compared fields include: description, brand, model, color, distinguishing features.

### 7.2 Image Similarity

**Method:** Perceptual Hash (pHash) via Pillow + ImageHash

- Each uploaded image is reduced to a 16×16 perceptual hash (256-bit fingerprint).
- All photos from the lost item are compared against all photos from the found item.
- Similarity = `(256 - hamming_distance) / 256`
- The **best match score** across all photo pairs is used.
- Image hashes are cached in Firebase (`image_hashes` field).

### 7.3 Location Scoring

**Method:** Haversine Distance Formula

The system calculates the great-circle distance between the found item's location and the lost item's location(s).

| Distance        | Score  | Reasoning                                |
|-----------------|--------|------------------------------------------|
| < 1 km          | 1.0    | Same area — very likely match            |
| 1–5 km          | 1.0→0.6 | Nearby — linear decrease                |
| 5–20 km         | 0.6→0.1 | Same district — possible but less likely |
| > 20 km         | 0.0    | Too far — unlikely match                 |

For lost items with a route (from/to locations), the system scores against both points and takes the better score.

### 7.4 Time Scoring

Compares when the item was found against when the item was reported lost.

| Condition                        | Score               |
|----------------------------------|---------------------|
| Found time within lost time window | 1.0               |
| Outside window by X hours       | `max(0, 0.5 - X/48)` |

This means items found up to 24 hours outside the reported loss window still receive a partial time score.

### 7.5 Composite Score & Threshold

Each scoring dimension produces a value from 0.0 to 1.0. The composite score combines all four dimensions.

**Category Gate:** Items must be in the **same category** to be compared. Cross-category matches are never produced.

**Match Threshold:** A composite score of **≥ 0.95 (95%)** is required to:
- Create a match record in Firebase
- Send an in-app notification to the lost item owner
- Send an email notification to the lost item owner

Scores below 95% are discarded and no notification is sent.

---

## 8. Data Models & Firebase Structure

All data is stored in **Firebase Realtime Database (RTDB)**.

### 8.1 Users Collection

**Path:** `users/{uid}`

| Field                       | Type      | Required | Description                             |
|-----------------------------|-----------|----------|-----------------------------------------|
| `uid`                       | string    | Yes      | Firebase Auth UID                       |
| `email`                     | string    | Yes      | User's email address                    |
| `name`                      | string    | Yes      | Display name                            |
| `phone`                     | string    | No       | Nepal phone (98/97XXXXXXXX)             |
| `avatarUrl`                 | string    | No       | Profile picture (base64 or URL)         |
| `role`                      | string    | Yes      | `"user"` or `"admin"`                   |
| `notifications.emailOnApproval` | boolean | No   | Email when item is approved             |
| `notifications.emailOnMatch`    | boolean | No   | Email when match is found               |
| `notifications.inAppNotifications` | boolean | No | In-app notification preference        |
| `createdAt`                 | timestamp | Yes      | Account creation time                   |
| `is_active`                 | boolean   | No       | `false` if deactivated by admin         |

### 8.2 Items Collection

**Path:** `items/{itemId}`

**Common Fields:**

| Field                 | Type    | Required | Description                                 |
|-----------------------|---------|----------|---------------------------------------------|
| `userId`              | string  | Yes      | Owner's UID                                 |
| `type`                | string  | Yes      | `"lost"` or `"found"`                       |
| `category`            | string  | Yes      | One of 12+ categories                       |
| `status`              | string  | Yes      | `"pending"`, `"approved"`, `"rejected"`, `"resolved"` |
| `description`         | string  | Yes      | Free-text item description                  |
| `brand`               | string  | No       | Item brand                                  |
| `model`               | string  | No       | Item model                                  |
| `color`               | string  | No       | Primary color                               |
| `secondaryColor`      | string  | No       | Secondary color                             |
| `district`            | string  | No       | Nepal district                              |
| `city`                | string  | No       | City/municipality within district           |
| `locationFromLat`     | number  | Yes      | Latitude (from point)                       |
| `locationFromLng`     | number  | Yes      | Longitude (from point)                      |
| `locationToLat`       | number  | No       | Latitude (to point, lost items only)        |
| `locationToLng`       | number  | No       | Longitude (to point, lost items only)       |
| `lostLocationDescription`  | string | No  | Text description of lost location           |
| `foundLocationDescription` | string | No  | Text description of found location          |
| `timeFrom`            | string  | Yes      | ISO timestamp — when lost/found             |
| `timeTo`              | string  | No       | ISO timestamp — end of loss window          |
| `contactName`         | string  | Yes      | Reporter's name                             |
| `contactEmail`        | string  | Yes      | Reporter's email                            |
| `contactPhone`        | string  | Yes      | Reporter's phone                            |
| `photoData`           | string  | No       | Base64-encoded photo (max 250 KB)           |
| `videoData`           | string  | No       | Base64-encoded video (max 400 KB)           |
| `estimatedValue`      | number  | No       | Estimated value / reward amount             |
| `policeReportFiled`   | boolean | No       | Whether a police report was filed           |
| `policeReportNumber`  | string  | No       | Police report reference number              |
| `createdAt`           | timestamp | Yes    | Submission timestamp                        |
| `match_processed`     | boolean | No       | Whether matching has been run               |
| `text_embedding`      | float[] | No       | Cached 384-dim text embedding               |
| `image_hashes`        | string[]| No       | Cached perceptual hash strings              |

**Category-Specific Fields (examples):**

| Category    | Additional Fields                                    |
|-------------|------------------------------------------------------|
| Electronics | `os`, `storage`                                      |
| Pets        | `name`, `breed`, `microchipId`, `collarColor`, `age` |
| Person      | `name`, `age`, `gender`, `height`, `lastSeenWearing` |
| Wallet      | `documentType`, `contents`                           |
| Jewelry     | `material`, `jewelryWeight`                          |
| Keys        | `numberOfKeys`, `keyType`, `keychain`                |
| Vehicles    | `vehicleType`, `licensePlate`, `vin`                 |
| Instruments | `instrumentType`, `serialNumber`                     |
| Glasses     | `eyewearType`, `frameColor`, `lensColor`             |

### 8.3 Matches Collection

**Path:** `matches/{matchId}`

| Field          | Type      | Required | Description                      |
|----------------|-----------|----------|----------------------------------|
| `lostItemId`   | string    | Yes      | Reference to the lost item       |
| `foundItemId`  | string    | Yes      | Reference to the found item      |
| `matchScore`   | number    | Yes      | Composite score (0–100)          |
| `status`       | string    | Yes      | `"pending"`, `"resolved"`, `"rejected"` |
| `text_score`   | number    | Yes      | Text similarity (0–1)            |
| `image_score`  | number    | Yes      | Image similarity (0–1)           |
| `location_score`| number   | Yes      | Location proximity (0–1)         |
| `time_score`   | number    | Yes      | Time overlap (0–1)               |
| `createdAt`    | timestamp | Yes      | When the match was created       |
| `resolvedAt`   | timestamp | No       | When the match was confirmed     |

### 8.4 Notifications Collection

**Path:** `notifications/{notificationId}`

| Field       | Type      | Required | Description                              |
|-------------|-----------|----------|------------------------------------------|
| `userId`    | string    | Yes      | Target user's UID                        |
| `type`      | string    | Yes      | `"match_found"`, `"item_approved"`, `"item_rejected"`, `"system"` |
| `message`   | string    | Yes      | Notification message text                |
| `matchId`   | string    | No       | Associated match (for match_found type)  |
| `read`      | boolean   | Yes      | Read/unread status                       |
| `createdAt` | timestamp | Yes      | When the notification was created        |

### Database Indexes

```json
{
  "items":         { ".indexOn": ["status", "userId", "type", "createdAt"] },
  "matches":       { ".indexOn": ["status", "lostItemId", "foundItemId"] },
  "notifications": { ".indexOn": ["userId", "read", "createdAt"] }
}
```

---

## 9. Security & Access Control

### Firebase RTDB Security Rules

**Items:**
- **Read**: Public — all approved/resolved items are visible to everyone.
- **Write**: Only the item owner (creator) or an admin can modify an item. New items can be created by any authenticated user.

**Users:**
- **Read/Write**: A user can only read/write their own profile. Admins can read/write any user profile.

**Matches:**
- **Read**: Any authenticated user.
- **Write**: Admin only (matches are system-generated). New matches can be created by authenticated users (backend service account).

**Notifications:**
- **Read**: Any authenticated user (filtered by userId in the application layer).
- **Write**: Any authenticated user (backend writes notifications on behalf of the system).

### Authentication Security

- Firebase Auth handles password hashing and token management.
- Password requirements: 8+ characters, 1 uppercase, 1 number, 1 special character.
- TOTP MFA available for additional account protection.
- Social auth providers configured with proper OAuth redirect URIs.
- Admin role is controlled via environment variable whitelist — not self-assignable.

### Frontend Access Control

- Protected routes redirect unauthenticated users to `/login`.
- Admin routes validate `profile.role === 'admin'` before rendering.
- Item edit/delete operations verify ownership.
- Pending items are hidden from non-owners and non-admins.

---

## 10. Email & Notification System

### In-App Notifications

- Stored in Firebase RTDB under `notifications/{id}`.
- Real-time delivery via Firebase listener (frontend) and WebSocket (backend).
- Toast popups on new notifications (Sonner library).
- Read/unread tracking with bulk "mark all read" support.

### Email Notifications

**Client-Side (EmailJS):**
- Used for lightweight email actions initiated from the frontend.
- Configuration: `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`.

**Server-Side (SMTP via Celery):**
- Used for match notification emails.
- Sends both HTML and plain-text versions.
- HTML email includes:
  - KhojTalas branded header (dark background with orange logo)
  - Match score badge (color-coded: green for ≥97%, orange for 95–97%)
  - Side-by-side comparison of lost and found items
  - Score breakdown table (text, image, location, time, total)
  - Call-to-action button linking to the found item
  - Footer with "no action needed" note

### WebSocket Notifications

- Endpoint: `/ws/{user_id}?token={token}`
- Supports multiple simultaneous connections per user (multi-device).
- Graceful disconnection handling.
- Real-time push of new notifications as they are created.

---

## 11. Geographic Coverage

KhojTalas provides complete coverage of Nepal's administrative divisions:

- **77 Districts** — Full district list from all 7 provinces.
- **400+ Municipalities/Cities** — Cascading city options based on selected district.

**Examples of District-City Mappings:**

| District     | Cities/Municipalities                                    |
|--------------|----------------------------------------------------------|
| Kathmandu    | Kathmandu, Kirtipur, Gokarneshwor, Budhanilkantha, etc. |
| Kaski        | Pokhara                                                  |
| Morang       | Biratnagar, Belbari, Urlabari, etc.                     |
| Lalitpur     | Lalitpur, Godawari, Mahalaxmi, etc.                     |
| Chitwan      | Bharatpur, Ratnanagar, etc.                              |

The `LocationSelector` component provides two cascading dropdown menus — selecting a district dynamically populates the available cities. This data is sourced from `nepalLocations.ts`.

---

## 12. User Workflows

### Workflow 1: Reporting a Lost Item

```
User → "Report Lost" → 4-Step Form → Submit
  → Item saved (status: pending)
  → Admin sees in Review Queue
  → Admin approves → status: approved
  → Matching pipeline runs against all approved found items
  → If match ≥ 95% → Notification + Email to owner
  → Owner reviews match → Clicks "Mark as Resolved"
  → Item and match status → resolved
```

### Workflow 2: Reporting a Found Item

```
User → "Report Found" → 4-Step Form (video required) → Submit
  → Item saved (status: pending)
  → Admin reviews and approves → status: approved
  → Celery task dispatched: run_matching(found_item_id)
  → Compares against all approved lost items (same category)
  → If match ≥ 95% → Match record + Notification + Email
  → Lost item owner reviews and resolves
```

### Workflow 3: Admin Item Review

```
Admin → Login → Dashboard (pending count badge)
  → "Review Queue" → Filter/Search items
  → Review item details (photo, description, location)
  → Approve: status → approved, triggers matching
  → Reject: status → rejected, reason required, notification sent
```

### Workflow 4: Browsing & Discovering Items

```
User → "Browse" → Apply filters (type, category, district, date)
  → View item cards → Click item → Item Details page
  → View photos, map, description, contact info
  → Optionally share the listing
```

### Workflow 5: User Account Management

```
User → "User Panel" → Profile tab
  → Update name, phone, avatar
  → Security tab → Change password, enable MFA
  → Items tab → View/edit/delete own items
  → Notifications tab → Configure preferences
  → Danger Zone → Delete account (with OTP verification)
```

---

## 13. Deployment & Configuration

### Frontend Deployment (Vercel)

The frontend is deployed to Vercel with the following configuration:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

All routes are rewritten to `index.html` for client-side routing (SPA mode).

### Admin Dashboard

The admin dashboard has a separate Vite build configuration:
- Dev server: port 4000
- Build output: `frontend/dist-admin`
- Entry: `frontend/admin.html`

### Backend Deployment

- **Runtime:** Python (see `runtime.txt`)
- **Server:** Uvicorn with FastAPI
- **Process Manager:** Procfile-based (for platforms like Heroku/Railway)
- **Task Worker:** Celery with Redis broker

### Build Commands

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm run dev`        | Start frontend dev server (port 3000) |
| `npm run dev:admin`  | Start admin dev server (port 4000)    |
| `npm run build`      | Production build (frontend)    |
| `npm run build:admin`| Production build (admin)       |
| `npm run lint`       | TypeScript type checking       |
| `npm run clean`      | Remove dist and dist-admin     |
| `npm run install:all`| Install frontend + backend deps|

---

## 14. Environment Variables

### Frontend (`.env.local`)

| Variable                           | Description                         |
|------------------------------------|-------------------------------------|
| `VITE_FIREBASE_API_KEY`            | Firebase project API key            |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Firebase Auth domain                |
| `VITE_FIREBASE_PROJECT_ID`        | Firebase project ID                 |
| `VITE_FIREBASE_STORAGE_BUCKET`     | Firebase Storage bucket             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase messaging sender ID       |
| `VITE_FIREBASE_APP_ID`            | Firebase app ID                     |
| `VITE_FIREBASE_DATABASE_URL`       | Firebase RTDB URL                   |
| `VITE_EMAILJS_SERVICE_ID`         | EmailJS service identifier          |
| `VITE_EMAILJS_TEMPLATE_ID`        | EmailJS template identifier         |
| `VITE_EMAILJS_PUBLIC_KEY`         | EmailJS public API key              |
| `VITE_ADMIN_EMAILS`               | Comma-separated admin email list    |
| `VITE_GEMINI_API_KEY`              | Google Gemini API key               |

### Backend

| Variable                       | Description                         |
|--------------------------------|-------------------------------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to service account JSON file   |
| `FIREBASE_DATABASE_URL`        | Firebase RTDB URL                   |
| `CELERY_BROKER_URL`            | Redis URL for Celery broker         |
| `CELERY_RESULT_BACKEND`        | Redis URL for Celery results        |
| `SMTP_HOST`                    | SMTP server hostname                |
| `SMTP_PORT`                    | SMTP server port                    |
| `SMTP_USER`                    | SMTP username/email                 |
| `SMTP_PASS`                    | SMTP password / app password        |
| `APP_URL`                      | Public URL of the application       |
| `CORS_ORIGINS`                 | Comma-separated allowed origins     |

---

## 15. Project Directory Structure

```
khojtalas/
├── package.json                    # Root scripts (dev, build, install)
├── metadata.json                   # App metadata
├── vercel.json                     # Vercel deployment config
├── database.rules.json             # Firebase RTDB security rules
├── firestore.rules                 # Firestore security rules
├── firebase-blueprint.json         # Firebase project blueprint
│
├── backend/
│   ├── requirements.txt            # Python dependencies
│   ├── runtime.txt                 # Python runtime version
│   ├── serviceAccountKey.json      # Firebase service account (secret)
│   └── app/
│       ├── main.py                 # FastAPI app entry point
│       ├── celery_app.py           # Celery configuration
│       ├── firebase_admin_init.py  # Firebase Admin SDK init
│       ├── Procfile                # Process manager config
│       ├── api/
│       │   └── routes/
│       │       ├── found_items.py  # Items & matches API
│       │       └── notifications.py# Notifications & WebSocket
│       └── services/
│           ├── matching_service.py # AI matching algorithm
│           └── tasks/
│               ├── email_tasks.py  # Email Celery tasks
│               └── match_tasks.py  # Matching Celery tasks
│
├── frontend/
│   ├── package.json                # Frontend dependencies
│   ├── tsconfig.json               # TypeScript config
│   ├── vite.config.ts              # Vite config (main app)
│   ├── vite.config.admin.ts        # Vite config (admin app)
│   ├── index.html                  # Main app entry HTML
│   ├── admin.html                  # Admin app entry HTML
│   └── src/
│       ├── main.tsx                # React app entry
│       ├── App.tsx                 # Root component & routes
│       ├── firebase.ts             # Firebase initialization
│       ├── index.css               # Global styles
│       ├── admin/
│       │   ├── main.tsx            # Admin app entry
│       │   ├── AdminApp.tsx        # Admin root component
│       │   └── AdminLogin.tsx      # Admin login page
│       ├── components/
│       │   ├── Navbar.tsx          # Navigation bar
│       │   ├── Footer.tsx          # Footer
│       │   ├── Notifications.tsx   # Notification dropdown
│       │   ├── LocationSelector.tsx# District/City picker
│       │   ├── LocationMarker.tsx  # Map pin component
│       │   ├── MapSearch.tsx       # Map search component
│       │   ├── MapController.tsx   # Map zoom/pan controls
│       │   ├── Logo.tsx            # Brand logo
│       │   ├── ScrollToTop.tsx     # Scroll restoration
│       │   ├── ErrorBoundary.tsx   # Error fallback UI
│       │   └── common/
│       │       ├── MatchToast.tsx  # Match notification toast
│       │       └── NotificationBell.tsx # Header bell icon
│       ├── contexts/
│       │   └── AuthContext.tsx      # Auth state management
│       ├── hooks/
│       │   ├── useNotifications.ts  # Notification hook
│       │   └── useAdmin.ts          # Admin operations hook
│       ├── layouts/
│       │   └── AdminLayout.tsx      # Admin page layout
│       ├── pages/
│       │   ├── Home.tsx             # Landing page
│       │   ├── Login.tsx            # Login page
│       │   ├── Register.tsx         # Registration page
│       │   ├── ReportLost.tsx       # Report lost item
│       │   ├── ReportFound.tsx      # Report found item
│       │   ├── EditItem.tsx         # Edit item
│       │   ├── Browse.tsx           # Browse/search items
│       │   ├── ItemDetails.tsx      # Item detail view
│       │   ├── MatchDetailPage.tsx  # Match comparison
│       │   ├── UserPanel.tsx        # User dashboard
│       │   ├── NotificationsPage.tsx# Notifications list
│       │   ├── AboutUs.tsx          # About page
│       │   ├── FAQ.tsx              # FAQ page
│       │   ├── TermsOfService.tsx   # Terms
│       │   ├── PrivacyPolicy.tsx    # Privacy policy
│       │   ├── CookiePolicy.tsx     # Cookie policy
│       │   └── admin/
│       │       ├── AdminDashboard.tsx    # Admin home
│       │       ├── ReviewQueuePage.tsx   # Review queue
│       │       ├── AdminMatchesPage.tsx  # Matches management
│       │       ├── AdminUsersPage.tsx    # User management
│       │       ├── AdminItemDetailPage.tsx # Admin item view
│       │       ├── ApprovedItemsPage.tsx # Approved items
│       │       └── RejectedItemsPage.tsx # Rejected items
│       ├── services/
│       │   ├── matchingService.ts   # Client-side matching
│       │   └── emailService.ts      # EmailJS integration
│       └── utils/
│           ├── nepalLocations.ts    # 77 districts + cities
│           ├── firestoreErrorHandler.ts # Error handling
│           └── media.ts             # Media utilities
│
└── dist-admin/                      # Built admin dashboard
    └── assets/
```

---

**End of Documentation**

*KhojTalas — Reuniting Nepal, One Item at a Time.*
