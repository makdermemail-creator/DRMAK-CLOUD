







export type UserRole = 'Admin' | 'Doctor' | 'Receptionist' | 'Sales' | 'Social Media Manager' | 'Operations Manager' | 'Designer';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  isAdmin?: boolean;
  isMainAdmin?: boolean;
};

export type Doctor = {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  consultationFees: number;
  availableDays: string[];
  availableTimings: string;
  avatarUrl: string;
};

export type Patient = {
  id: string; // This will be the document ID from Firestore
  mobileNumber: string; // This is the mobileNumber field
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  avatarUrl: string;
  salutation?: string;
  guardianName?: string;
  assignedDoctorId?: string;
  reasonForVisit?: string;
  registrationDate?: string; // ISO string
  referredBy?: string;
  maritalStatus?: 'Married' | 'Unmarried';
  status?: 'Active' | 'Inactive';
  smsPreference?: 'English' | 'Urdu';
  deceased?: boolean;
};

export type Appointment = {
  id: string;
  patientMobileNumber: string;
  doctorId: string;
  appointmentDateTime: string; // ISO string
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show' | 'Checked In' | 'Confirmed';
  procedure?: string;
  comments?: string;
  // The following fields will be enriched after fetching
  patient?: Patient;
  doctor?: Doctor;
};

export type VisitRecord = {
    id: string;
    appointmentId: string;
    appointmentDate: string; // ISO String
    diagnosis: string;
    prescribedMedicines?: string[];
    proceduresTreatments?: string[];
    doctorNotes?: string;
    // Enriched fields
    patient?: Patient;
    doctor?: Doctor;
};

export type FamilyHistory = {
  id: string;
  patientId: string;
  relativeName: string;
  gender: 'Male' | 'Female' | 'Other';
  relationship: string;
  bloodGroup?: string;
  remarks?: string;
};

export type MedicalHistory = {
    id: string;
    patientId: string;
    text: string;
    type: 'History' | 'Alert' | 'Suggestion';
    createdAt: string; // ISO string
}

export type HealthRecord = {
    id: string;
    patientId: string;
    userId: string;
    recordDate: string; // ISO string
    complaint?: string;
    diagnosis?: string;
    clinicalNotes?: string;
    advice?: string;
    investigation?: string;
    plan?: string;
    procedures?: string[];
    followUpDate?: string; // ISO string
};


export type PharmacyItem = {
  id: string;
  productName: string;
  genericName?: string;
  barcode?: string;
  category: string;
  manufacturer?: string;
  supplier: string;
  unit?: string;
  stockingUnit?: number;
  conversionUnit?: number;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  expiryDate: string; // ISO string
  active: boolean;
};

export type Visit = {
  id: string;
  date: string;
  doctor: Doctor;
  diagnosis: string;
  prescription: { medicine: string; dosage: string }[];
  procedures: string[];
  notes: string;
  billed: boolean;
};

export type BillingRecord = {
    id: string;
    patientMobileNumber: string;
    consultationCharges: number;
    procedureCharges: number;
    medicineCharges: number;
    paymentMethod: string;
    billingDate: string; // ISO String
}

export type PharmacyRack = {
    id: string;
    name: string;
    createdAt: { seconds: number, nanoseconds: number };
    items: string[];
}

export type StockEntry = {
    id: string;
    supplier: string;
    document: string;
    sku: number;
    createdAt: string;
    supplierInvoiceDate: string;
    supplierInvoice: string;
    items: StockItem[];
}

export type StockItem = {
    sr: number;
    itemName: string;
    manufacturer: string;
    category: string;
    conversionUnit: number;
    totalQty: number;
    qtyInUnits: number;
    unit: string;
    unitCost: number;
    unitCostWithTax: number;
    discountedPrice: number;
    netUnitCost: number;
    totalCost: number;
}

export type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted';
    source: string;
    assignedTo: string;
    createdAt: string;
};

export type DailyReport = {
    id: string;
    userId: string;
    reportDate: string; // ISO string
    summary: string;
    plans: string;
}

export type DailyTask = {
    id: string;
    userId: string;
    task: string;
    status: 'Pending' | 'Completed';
    dueDate: string; // ISO string
};

export type SocialReport = {
    id: string;
    userId: string;
    reportDate: string; // ISO string
    summary: string;
    metrics: string;
    plans: string;
};

export type InvoiceItem = {
    id: string;
    procedure: string;
    description: string;
    rate: number;
    quantity: number;
    amount: number;
    discount: number;
    performedBy: string;
};

export type Invoice = {
    id: string;
    patientId: string;
    patientMobileNumber: string;
    invoiceDate: string; // ISO string
    items: InvoiceItem[];
    subTotal: number;
    totalDiscount: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    status: 'Paid' | 'Pending' | 'Cancelled';
    notes?: string;
};

export type Communication = {
  id: string;
  patientId: string;
  message: string;
  service: string;
  sentBy: string;
  sentAt: string; // ISO string
};

export type TreatmentPlan = {
  id: string;
  patientId: string;
  procedure: string;
  total: number;
  scheduleDate: string; // ISO string
  addedBy: string; // User ID
  createdDate: string; // ISO string
  modifiedDate: string; // ISO string
};

export type FeatureAccess = {
  id: string;
  role: UserRole;
  features: { [key: string]: boolean };
};

    