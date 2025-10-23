# AWS Transcribe Setup Guide

## 🔧 **Environment Variables Required**

Add these to your `.env.local` file:

```bash
# AWS Configuration for Transcribe Streaming
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_here
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_key_here

# For production (use Cognito)
# NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=ap-south-1:your-pool-id

# Existing API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.vedika.ai.in
NEXT_PUBLIC_WEBSOCKET_URL=wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod
```

## 🚀 **Quick Setup**

1. **Copy the environment variables above**
2. **Replace `your_access_key_here` and `your_secret_key_here` with your AWS credentials**
3. **Save as `.env.local` in your project root**
4. **Restart your development server**

## 📝 **AWS Credentials**

You'll need AWS credentials with the following permissions:
- `transcribe:StartStreamTranscription`
- `transcribe:GetTranscriptionJob` (optional)

## 🧪 **Testing**

Once configured, the AWS Transcribe service will:
- ✅ Request microphone permission
- ✅ Start real-time transcription
- ✅ Show interim results as you speak
- ✅ Provide final results instantly

## 💰 **Cost**

- ~$36/month for 100 daily users
- Pay-per-use model
- No additional infrastructure needed
