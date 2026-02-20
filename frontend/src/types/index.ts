//All typescript interfaces
//These defines the shape of data thourghout the app

//Auth
export interface User {
    _id: string;
    name: string;
    phone: string;
    language: 'en' | 'hi' | 'mr' | 'ta';
    role: 'farmer' | 'admin';
    isVerified: boolean;
    createdAt: string;
}
export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: User;
    otp?: string;
}

//Profile
export interface FarmerProfile {
    _id: string;
    userId: string;
    name: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    socialCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority';
    aadhaarLast4?: string;
    state: string;
    district: string;
    block?: string;
    village?: string;
    landHolding: number;
    landHoldingHectares: number;
    landType?: 'Irrigated' | 'Rainfed' | 'Both';
    cropTypes: string[];
    annualIncome?: 'Below 2L' | '2L-5L' | '5L-10L' | 'Above 10L';
    hasBankAccount: boolean;
    hasKCC: boolean;
    profileCompleteness: number;
    createdVia: 'voice' | 'form';
    createdAt: string;
    updatedAt: string;
}

//Schemes
export interface Scheme {
    _id: string;
    name: string;
    shortName: string;
    ministry?: string;
    description?: string;
    benefitAmount?: string;
    pdf: {
        cloudinaryUrl: string;
        cloudinaryPublicId: string;
        originalFileName: string;
        fileSize?: number;
        totalPages?: number;
    };
    processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
    processingError?: string;
    totalChunks?: number;
    isActive: boolean;
    createdAt: string;
}

//Eligibility
export interface Citation {
    text: string;
    page: number;
    section: string;
    matchType: 'supports' | 'excludes';
}

export interface CriteriaMatch {
    criterion: string;
    farmerValue: string;
    requiredValue: string;
    isMatch: boolean;
}

export interface ExclusionCheck {
    exclusion: string;
    isExcluded: boolean;
    reason: string;
}

export interface EligibilityResult {
    _id: string;
    schemeId: string;
    schemeName: string;
    schemeShortName: string;
    isEligible: 'eligible' | 'not_eligible' | 'likely_eligible' | 'error';
    confidenceScore: number;
    benefitAmount?: string;
    reasoning: string;
    citations: Citation[];
    criteriaMatched: CriteriaMatch[];
    exclusionsChecked: ExclusionCheck[];
    requiredDocuments: string[];
    nextSteps: string[];
    responseTimeMs: number;
    llmModel: string;
    checkedAt: string;
    error?: string;
}

// ═══ APPLICATIONS ═══
export interface Application {
    _id: string;
    schemeId: string;
    schemeName: string;
    schemeShortName: string;
    status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';
    formData: Record<string, any>;
    documents: Array<{
        name: string;
        url: string;
        uploadedAt: string;
    }>;
    submittedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// ═══ ACTIVITY ═══
export interface Activity {
    _id: string;
    type: 'check' | 'upload' | 'profile_update' | 'application' | 'login';
    description: string;
    schemeShortName?: string;
    timestamp: string;
    icon?: string;
}

// ═══ DASHBOARD ═══
export interface DashboardMetrics {
    totalSchemes: number;
    eligibleCount: number;
    notEligibleCount: number;
    potentialBenefit: string;
    avgResponseTime: number;
    totalChecks: number;
    pdfsUploaded: number;
}

export interface SchemeOverview {
    _id: string;
    name: string;
    shortName: string;
    processingStatus: string;
    totalPages?: number;
    totalChunks?: number;
    originalFileName?: string;
}

export interface DashboardData {
    profile: FarmerProfile | null;
    hasProfile: boolean;
    metrics: DashboardMetrics;
    eligibleSchemes: EligibilityResult[];
    notEligibleSchemes: EligibilityResult[];
    schemesOverview: SchemeOverview[];
    applications: Application[];
    recentActivity: Activity[];
}

// ═══ VOICE ═══
export interface VoiceParsedProfile {
    extractedData: Record<string, any>;
    extractedFields: string[];
    totalFieldsExtracted: number;
    originalVoiceText: string;
}

export interface VoiceParsedQuery {
    intent: 'check_eligibility' | 'check_all' | 'scheme_info' | 'update_profile' | 'help' | 'unknown';
    schemeName: string | null;
    question: string;
    confidence: number;
}

// ═══ API RESPONSE WRAPPER ═══
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    [key: string]: any;
}


