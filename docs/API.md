# KhetiSetu API Specification (v1)

> **Base URL:** `/api/v1`  
> **Protocol:** HTTPS (in production)  
> **Authentication:** Bearer JWT Access Token + HttpOnly Refresh Token Cookie  

---

## 1. Authentication Endpoints

### `POST /auth/register`
Register a new user (Role restricted to `FARMER`, `CONSUMER`, `BUSINESS`).
- **Rate Limit:** 30 requests / 15 minutes
- **Request Body:**
  ```json
  {
    "email": "farmer@example.com",
    "password": "Password123!",
    "fullName": "Rameshwar Patil",
    "phone": "+919876543210",
    "role": "FARMER",
    "profileData": {
      "farmName": "Sahyadri Organic Farm",
      "district": "Pune",
      "state": "Maharashtra"
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "...", "role": "FARMER" },
      "accessToken": "ey..."
    },
    "message": "Registration successful"
  }
  ```

### `POST /auth/login`
Authenticate user with progressive lockout protection.
- **Rate Limit:** 10 attempts / 15 minutes
- **Request Body:**
  ```json
  {
    "email": "farmer@khetisetu.demo",
    "password": "KhetiSetu@2026!"
  }
  ```

### `POST /auth/refresh`
Rotate refresh token and issue a new access token.
- **Request:** Automatic via HttpOnly `refreshToken` cookie.

### `POST /auth/logout`
Revoke refresh token and terminate active session.

---

## 2. Farmer Endpoints

### `GET /farmer/profile`
Retrieve farmer's farm profile, soil type, and location.

### `POST /farmer/batches`
Create a new harvest produce batch.
- **Request Body:**
  ```json
  {
    "cropName": "Tomato",
    "quantity": 1000,
    "unit": "kg",
    "harvestDate": "2026-10-19",
    "storageInformation": { "method": "Ventilated Field Barn" }
  }
  ```

### `POST /farmer/batches/:id/quality-assess`
Upload produce photo for Gemini AI visual grading.
- **Content-Type:** `multipart/form-data`
- **Fields:** `produceImage` (JPG, PNG, WEBP, max 5MB)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "assessment": {
        "classification": "GOOD_QUALITY",
        "confidence": 0.94,
        "observations": ["Uniform red gloss", "Intact calyx"],
        "estimatedShelfLife": "8-10 days",
        "recommendedAction": "Qualified for Grade-A marketplace listing."
      }
    }
  }
  ```

### `POST /farmer/listings`
Create a marketplace listing from a batch.

---

## 3. Marketplace Endpoints

### `GET /marketplace/products`
Query active produce listings.
- **Query Params:** `category`, `search`, `isB2B`, `isB2C`, `minPrice`, `maxPrice`, `page`, `limit`

### `GET /marketplace/products/:id`
Retrieve product details, farmer profile, batch provenance, and AI quality report.

---

## 4. Order & Checkout Endpoints

### `POST /orders`
Server-authoritative order creation with atomic inventory reservation.
- **Headers:** `Idempotency-Key` (Optional UUID)
- **Request Body:**
  ```json
  {
    "items": [{ "productId": "...", "quantity": 10 }],
    "deliveryAddress": {
      "fullName": "Buyer Name",
      "phone": "+919876543210",
      "line1": "Road 1",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001"
    },
    "paymentMethod": "UPI"
  }
  ```

---

## 5. Market & Weather Intelligence

### `GET /market/prices`
Current APMC mandi commodity prices.

### `GET /market/prices/:crop/history`
30-day historical prices and mathematical WMA price prediction.

### `GET /market/recommendation`
Smart Mandi Ranking based on Net Return:
`Net Return = (Gross Revenue) - (Logistics Freight) - (Handling Cess)`.

### `GET /weather`
Agricultural weather forecast and field operations matrix (spraying, irrigation, harvesting).

---

## 6. AI Assistant

### `POST /ai/chat`
Consult Kheti AI assistant in Hindi, English, or Hinglish with farm context.
- **Request Body:**
  ```json
  {
    "message": "टमाटर की फसल में पत्ती धब्बा रोग का क्या उपाय है?"
  }
  ```

---

## 7. Admin Endpoints

- `GET /admin/overview` - Platform revenue, users, orders, health telemetry.
- `GET /admin/users` - Paginated user directory with role inspection.
- `PATCH /admin/users/:id` - Lock/unlock user accounts.
- `GET /admin/audit-logs` - Query immutable security audit events.
