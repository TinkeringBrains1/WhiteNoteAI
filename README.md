# **Whitenote AI \- SaaS Fraud Prevention Tool**

Whitenote AI is an automated, multi-agent AI pipeline designed to intercept, analyze, and flag fraudulent invoices after the payments have been processed in order to not repeat it in the future. It combines document parsing, external data validation, and real-time communication (whatsapp & gmail) to act as an unbreakable safety net for financial teams.

## **Key Features**

* **Multi-Agent Pipeline**: Invoices are processed sequentially by specialized AI agents:  
  1. **Parser Agent**: Extracts line items and metadata from PDF uploads.  
  2. **GST Validator**: Verifies Vendor GSTIN against filings.  
  3. **Search Agent**: Matches data against historical invoice records.  
  4. **Anomaly Scorer**: Computes a composite risk score out of 100\.  
* **Real-Time Meta WhatsApp Alerts**: Instantly pings administrators via WhatsApp (Graph API v25.0) when a high-risk or phantom invoice is detected.  
* **Immutable Audit Trail**: All pipeline actions, risk scores, and AI reasoning are permanently logged in a PostgreSQL database.  
* **Modern Frontend**: Built with Next.js, featuring real-time state visualization of the agent pipeline.

## **Tech Stack**

* **Frontend/Backend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui  
* **Database**: PostgreSQL (via AWS)
* **Alerts Gateway**: Meta Cloud API (WhatsApp Business v25.0)  

## **Local Setup & Installation**

### **1\. Clone the repository**

```
git clone \[https://github.com/your-username/whitenote-ai.git\](https://github.com/your-username/whitenote-ai.git)  
cd whitenote-ai
```

### **2\. Install dependencies**
```
npm install
```
### **3\. Environment Variables**

Create a .env.local file in the root directory and add your credentials:
```
# Meta WhatsApp Cloud API Credentials (v25.0)  
WHATSAPP_PHONE_NUMBER_ID=  
WHATSAPP_ACCESS_TOKEN=

# Master Override for Live Alerts (Include Country Code, e.g., 91 for India)  
WHATSAPP_ALERT_RECIPIENT=

GEMINI_API_KEY=  
DATABASE_URL=

DB_HOST=  
DB_USER=  
DB_PASSWORD=  
DB_PORT=  
DB_NAME=
```
### **4\. Database Setup**

Ensure you have a PostgreSQL database connected. You will need to create the following tables:

* invoices: Core transactional records.  
* invoice\_queue: Materialized view for dashboard rendering.  
* audit\_log: Immutable telemetry trail.

