//Auth context 
//React context provides global state accessible form any components without prop drilling (passing props through 10 levels);

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { FarmerProfile, User } from "../types";
import api from "../services/api";

interface AuthContextType {
  user: User | null;
  profile: FarmerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password?: string) => Promise<string | undefined>;
  sendOTP: (phone: string) => Promise<string | undefined>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (user: User) => void;
  updateProfile: (profile: FarmerProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

//Storage keys

const TOKEN_KEY = 'niti_setu_token';
const USER_KEY = 'niti_setu_user';

export const AuthProvider:React.FC<{children: ReactNode}> = ({children}) =>{
    const [user,setUser] = useState<User | null>(null);
    const [profile,setProfile] = useState<FarmerProfile | null>(null);
    const [loading , setLoading] = useState(true);

    useEffect(()=>{
        checkAuthStatus();
    },[]);

    const checkAuthStatus = async () =>{
        const token = localStorage.getItem(TOKEN_KEY);

        if(!token){
            setLoading(false);
            return;
        }

        try{
            //Verifying token with backend
            const {data} = await api.get('/auth/me');
            setUser(data.user);
            
            //Trying to get profile
            try{
                const profileRes = await api.get('/profile');
                
                if(profileRes.data.success){
                    setProfile(profileRes.data.profile);
                }
            }catch{
                //No profile yet
            }
        }catch(error: any){
            // Only clear token on 401 (invalid/expired token).
            // Network errors, 5xx server errors, or CORS issues should NOT log the user out —
            // they just mean the backend is temporarily unreachable.
            const status = error?.response?.status;
            if(status === 401){
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setUser(null);
                setProfile(null);
            }
            // Otherwise: keep the token — backend may just be slow to wake up (Render free tier)
        }finally{
            setLoading(false);
        }
    };

    //Register : creates a new account 

    const register = useCallback (async (name: string,phone:string, password?: string):Promise<string | undefined> =>{
        const {data} = await api.post('/auth/register',{
            name,phone,password,
        });

        //saving token and user
        localStorage.setItem(TOKEN_KEY,data.token);
        localStorage.setItem(USER_KEY,JSON.stringify(data.user));

        setUser(data.user);
        return data.otp;

    },[]);
    //Send otp
    const sendOTP = useCallback(async (phone: string): Promise<string | undefined> =>{
        const {data} = await api.post('/auth/send-otp',{phone});
        return data.otp;
    },[]);

    //Login with otp
    const login = useCallback(async (phone: string,otp: string)=>{
        const {data} = await api.post('/auth/verify-otp',{phone,otp});
        localStorage.setItem(TOKEN_KEY,data.token);
        localStorage.setItem(USER_KEY,JSON.stringify(data.user));
        setUser(data.user);

        //Getting profile if exists
        try{
            const profileRes = await api.get('/profile');

            if(profileRes.data.success){
                setProfile(profileRes.data.profile);
            }
        }catch{
            // No Profile yet
        }
    },[])
    //Login with password

    const loginWithPassword = useCallback(async (phone: string, password: string)=>{

        const {data} = await api.post('/auth/login',{phone,password});
        localStorage.setItem(TOKEN_KEY,data.token);
        localStorage.setItem(USER_KEY,JSON.stringify(data.user));
        setUser(data.user);

        //Get Profile
        try{
            const profileRes = await api.get('/profile');

            if(profileRes.data.success){
                setProfile(profileRes.data.profile);
            }
        }catch{
            //No Profile yet
        }


    },[]);


    //Logout
    const logout = useCallback(()=>{
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setProfile(null);
    },[]);

    //Refresh profile
    //call after profile is created/updated
    const refreshProfile = useCallback( async ()=>{
        try{
            const {data} = await api.get('/profile');
            if(data.success){
                setProfile(data.profile);
            }
        }catch{
            //Profile might not exists yet
        }
    },[]);

    //Update Helpers
    //Used by other components to update state without making api calls

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }, []);

    const updateProfile = useCallback((updatedProfile: FarmerProfile) => {
        setProfile(updatedProfile);
    }, []);

    // ── Context Value ──
    const value: AuthContextType = {
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        hasProfile: !!profile,
        login,
        loginWithPassword,
        register,
        sendOTP,
        logout,
        refreshProfile,
        updateUser,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

//Custorm Hook : useAuth()
export const useAuth = ():AuthContextType =>{
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth must be used within an AuthProvider.');
    }
    return context;
}




