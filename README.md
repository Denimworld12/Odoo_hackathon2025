# 🎥 Project Demo (YouTube)

https://youtu.be/FLX0AocLOyo

---

## 🌐 Landing Page

<img width="1847" height="1027" alt="Landing Page" src="https://github.com/user-attachments/assets/cde15f3d-60c4-4ee2-b0b5-84faef42962e" />

---

## 🚦 Handling Race Conditions in High-Traffic Booking Systems

In high-traffic booking environments, **multiple users may attempt to book the same time slot at the same time**.  
Without proper consistency mechanisms, this leads to **double bookings**, broken trust, and data corruption.

This system prevents such failures using a **two-layer protection strategy**:
- Soft-Hold Reservations (UX level)
- Atomic Database Transactions (Data integrity level)

---

### 🧠 The Challenge: Race Conditions

**Scenario:**  
Two users click **“Book”** on the same **10:00 AM slot** at the exact same moment.

Without synchronization:
- Both requests pass validation
- Two booking records are created
- One slot → two customers  

Result: **Double Booking Failure**

---

### 🛡️ Our Solution: Soft-Hold + Atomic Locking

We implemented a **two-layer consistency model** to ensure correctness and smooth user experience.

---

### 🔹 Layer A: 5-Minute Soft-Hold (Frontend / Cache Level)

This layer focuses on **User Experience** and prevents last-step booking failures.

**How it works:**
- When a user selects a slot, it is marked as **PENDING / LOCKED**
- The slot is immediately hidden from other users
- The hold lasts **5 minutes**

**Expiry logic:**
- Booking completed → slot becomes **CONFIRMED**
- User abandons flow → slot automatically becomes **AVAILABLE**
---

### 🔹 Layer B: Database-Level Atomic Transactions (Backend)

This layer guarantees **mathematical consistency** using PostgreSQL transactions and row-level locking.

**Strategy:**
- Booking logic is wrapped inside a transaction
- Slot availability is checked inside the transaction
- Row-level locks prevent concurrent writes

```sql
BEGIN;

SELECT id
FROM bookings
WHERE slot_id = $1
  AND status != 'CANCELLED'
FOR UPDATE;

-- If no rows are returned, slot is free
-- Proceed with INSERT

COMMIT;
```


###  How to Run the Project
**🧩 Backend Setup**
```sql
npm install
npm start
````
---
**Backend Environment Variables (.env):**
```sql 
DATABASE_URL=postgresql://neondb_owner:npg_HeP0aAlLq8nU@ep-polished-snow-ahcelp7h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
JWT_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
```
---
**🎨 Frontend Setup**
```sql
npm install
npm run dev
```
---

**Frontend Environment Variables (.env.local):**
```sql
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```
---
###
Sign In & Sign Up
###
<img width="1849" height="1021" alt="Sign In / Sign Up" src="https://github.com/user-attachments/assets/a57df1b4-5d2f-4b85-8c06-f1519158aab0" />
### 🏠 Home Page
<img width="1844" height="1029" alt="Home Page" src="https://github.com/user-attachments/assets/7e273a17-c710-437a-9ae8-2debf0b9cdbf" /> <img width="1856" height="993" alt="Home Page" src="https://github.com/user-attachments/assets/3ae12c1e-42e9-4332-8a01-db9a57d2c9a0" /> <img width="1856" height="993" alt="Home Page" src="https://github.com/user-attachments/assets/4c7efd21-4a0c-4223-a411-092130753743" />
###📅 Booking Flow
<img width="1190" height="825" alt="Booking Flow" src="https://github.com/user-attachments/assets/4faa4c78-bb0e-4edc-8f38-b53fb693f420" /> <img width="1864" height="996" alt="Booking Flow" src="https://github.com/user-attachments/assets/ecd2dc55-3f24-4179-ac5b-768cce6c74fd" />
###
<img width="962" height="759" alt="User Dashboard" src="https://github.com/user-attachments/assets/0de025b1-e22a-4f26-9ad1-3d1db60e9ca8" /> <img width="1865" height="996" alt="User Dashboard" src="https://github.com/user-attachments/assets/875e0ac1-0d8f-4ea9-8ef8-ee5e081bdf0c" />
###
<img width="1849" height="1005" alt="Additional Screen" src="https://github.com/user-attachments/assets/0ddaad8c-a5f8-4625-9fb8-fe4627b956a0" /> <img width="1856" height="1002" alt="Additional Screen" src="https://github.com/user-attachments/assets/89e2e504-3573-4401-a60a-373befea300d" />
###
