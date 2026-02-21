
export interface StateData {
    name: string;
    districts: string[];
}

export const indianStates: StateData[] = [
    {
        name: 'Andhra Pradesh',
        districts: ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'West Godavari'],
    },
    {
        name: 'Bihar',
        districts: ['Araria', 'Begusarai', 'Bhagalpur', 'Darbhanga', 'Gaya', 'Muzaffarpur', 'Nalanda', 'Patna', 'Purnia', 'Samastipur', 'Vaishali'],
    },
    {
        name: 'Chhattisgarh',
        districts: ['Bastar', 'Bilaspur', 'Dhamtari', 'Durg', 'Janjgir-Champa', 'Korba', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Surguja'],
    },
    {
        name: 'Gujarat',
        districts: ['Ahmedabad', 'Amreli', 'Anand', 'Banaskantha', 'Bhavnagar', 'Junagadh', 'Kheda', 'Mehsana', 'Rajkot', 'Surat', 'Vadodara'],
    },
    {
        name: 'Haryana',
        districts: ['Ambala', 'Bhiwani', 'Faridabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Karnal', 'Kurukshetra', 'Panipat', 'Rohtak', 'Sirsa', 'Sonipat'],
    },
    {
        name: 'Jharkhand',
        districts: ['Bokaro', 'Deoghar', 'Dhanbad', 'Dumka', 'Giridih', 'Hazaribagh', 'Jamshedpur', 'Ranchi'],
    },
    {
        name: 'Karnataka',
        districts: ['Bagalkot', 'Belgaum', 'Bellary', 'Bengaluru', 'Bidar', 'Dakshina Kannada', 'Dharwad', 'Hassan', 'Mandya', 'Mysuru', 'Raichur', 'Shimoga', 'Tumkur'],
    },
    {
        name: 'Kerala',
        districts: ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kozhikode', 'Malappuram', 'Palakkad', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
    },
    {
        name: 'Madhya Pradesh',
        districts: ['Bhopal', 'Dewas', 'Gwalior', 'Hoshangabad', 'Indore', 'Jabalpur', 'Rewa', 'Sagar', 'Satna', 'Ujjain', 'Vidisha'],
    },
    {
        name: 'Maharashtra',
        districts: ['Ahmednagar', 'Akola', 'Aurangabad', 'Jalgaon', 'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nashik', 'Pune', 'Sangli', 'Satara', 'Solapur'],
    },
    {
        name: 'Odisha',
        districts: ['Angul', 'Balasore', 'Cuttack', 'Ganjam', 'Kalahandi', 'Kendrapara', 'Khordha', 'Mayurbhanj', 'Puri', 'Sambalpur'],
    },
    {
        name: 'Punjab',
        districts: ['Amritsar', 'Bathinda', 'Faridkot', 'Firozpur', 'Gurdaspur', 'Jalandhar', 'Ludhiana', 'Moga', 'Patiala', 'Sangrur'],
    },
    {
        name: 'Rajasthan',
        districts: ['Ajmer', 'Alwar', 'Barmer', 'Bharatpur', 'Bikaner', 'Jaipur', 'Jaisalmer', 'Jodhpur', 'Kota', 'Nagaur', 'Sikar', 'Udaipur'],
    },
    {
        name: 'Tamil Nadu',
        districts: ['Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Erode', 'Kanchipuram', 'Madurai', 'Salem', 'Thanjavur', 'Tiruchirappalli', 'Tirunelveli', 'Vellore'],
    },
    {
        name: 'Telangana',
        districts: ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Medak', 'Nalgonda', 'Nizamabad', 'Rangareddy', 'Warangal'],
    },
    {
        name: 'Uttar Pradesh',
        districts: ['Agra', 'Aligarh', 'Allahabad', 'Bareilly', 'Gorakhpur', 'Jhansi', 'Kanpur', 'Lucknow', 'Mathura', 'Meerut', 'Moradabad', 'Varanasi'],
    },
    {
        name: 'West Bengal',
        districts: ['Bankura', 'Bardhaman', 'Birbhum', 'Hooghly', 'Howrah', 'Kolkata', 'Malda', 'Medinipur', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'South 24 Parganas'],
    },

];
export const commonCrops: string[] = [
    'Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton',
    'Sugarcane', 'Mustard', 'Groundnut', 'Pulses', 'Jowar',
    'Bajra', 'Barley', 'Sunflower', 'Sesame', 'Jute',
    'Tea', 'Coffee', 'Rubber', 'Coconut', 'Arecanut',
    'Banana', 'Mango', 'Onion', 'Potato', 'Tomato',
    'Chilli', 'Turmeric', 'Ginger', 'Garlic', 'Other',
];

export const getDistricts = (stateName: string): string[] => {
    const state = indianStates.find((s) => s.name.toLowerCase() === stateName.toLowerCase());

    return state?.districts || [];
}

