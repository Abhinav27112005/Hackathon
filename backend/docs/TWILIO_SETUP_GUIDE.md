# 📱 Twilio SMS OTP Setup Guide

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up (FREE - $15 credit)
3. Verify your email

## Step 2: Get Your Credentials

After signup, you'll see your **Dashboard**:

```
┌──────────────────────────────────────┐
│  ACCOUNT SID: ACxxxxxxxxxxxx         │
│  AUTH TOKEN: [hidden] (click to show)│
│  MY TWILIO PHONE NUMBER: +1xxxxxxx   │
└──────────────────────────────────────┘
```

### What are these?

- **ACCOUNT SID**: Your Twilio account ID (like username)
- **AUTH TOKEN**: Your secret password (keep this safe!)
- **TWILIO PHONE NUMBER**: The phone number that will send SMS

## Step 3: Get a Phone Number

1. In dashboard → Click **Get a Trial Number**
2. Twilio will assign you a FREE number
3. Copy this number (format: +12345678901)

## Step 4: Add to .env File

Add these 3 variables to your `.env` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 5: Verify Test Numbers (Trial Account)

⚠️ **IMPORTANT for Trial Account:**

Trial accounts can ONLY send to **verified numbers**.

### To verify a phone number:
1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter your Indian phone number: +919876543210
4. Twilio will call you with a verification code
5. Enter the code

### For Hackathon Demo:
- Verify YOUR phone number
- Verify JUDGES' phone numbers (if you have them)
- For other demos, use development mode (OTP in response)

## Step 6: Understand Limits

### Free Trial:
- ✅ $15 credit (~500-1000 SMS)
- ✅ Only verified numbers
- ✅ SMS will have "Sent from your Twilio trial account" prefix

### Paid Account (upgrade later):
- ✅ Send to ANY number
- ✅ No prefix message
- ✅ Pay as you go (~₹0.50 per SMS for India)

## Step 7: Test Your Setup

Use Postman or your frontend to test:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "password": "test123"
}
```

You should receive an SMS on your verified number!

## Troubleshooting

### Error: "The number +919876543210 is unverified"
**Solution**: Add the number to Verified Caller IDs first

### Error: "Unable to create record: Invalid phone number"
**Solution**: Phone number format should be E.164 (+919876543210)

### Error: "Authentication failed"
**Solution**: Check your ACCOUNT_SID and AUTH_TOKEN in .env

---

## Quick Reference

```javascript
// Twilio sending flow:
Your Backend → Twilio API → User's Phone
     ↑
  Uses: ACCOUNT_SID, AUTH_TOKEN, TWILIO_PHONE_NUMBER
```
