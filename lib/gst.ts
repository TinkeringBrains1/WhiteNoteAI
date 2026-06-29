export interface GSTDetails {
  valid: boolean;
  gstin: string;
  tradeName: string;
  status: 'Active' | 'Inactive' | 'Pending';
  registrationDate: string;
}

export interface IRNDetails {
  valid: boolean;
  irn: string;
  status: 'ACT' | 'CNL'; // Active or Cancelled
}

const isMockMode = process.env.GST_MOCK_MODE === 'true';

export async function getGSTDetails(gstin: string): Promise<GSTDetails | null> {
  if (isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // DEMO A: Phantom Vendor (Sharma Enterprises) - Inactive/Fake GSTIN
    if (gstin === '27AABCS1429B1ZB') {
      return {
        valid: false,
        gstin,
        tradeName: 'Sharma Enterprises',
        status: 'Inactive',
        registrationDate: '2019-05-12',
      };
    }

    // DEMO B & C Default Valid Base Baseline
    return {
      valid: true,
      gstin,
      tradeName: 'Valid Vendor Corp',
      status: 'Active',
      registrationDate: '2018-01-01',
    };
  }

  throw new Error("Real GST API integration not yet implemented.");
}

export async function verifyIRN(irn: string, gstin: string): Promise<IRNDetails | null> {
  if (isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    // DEMO A Failure
    if (gstin === '27AABCS1429B1ZB' || irn.startsWith('FAKE')) {
      return {
        valid: false,
        irn,
        status: 'CNL',
      };
    }

    return {
      valid: true,
      irn,
      status: 'ACT',
    };
  }

  throw new Error("Real IRN API integration not yet implemented.");
}