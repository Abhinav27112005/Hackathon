import React from 'react';
import { Navigate,useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

//Protected Route: Wraps pages that require authentication
interface ProtectedRouteProps{
    children: React.ReactNode;
    requireProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children,requireProfile = false}) => {
    const {isAuthenticated,hasProfile,loading} = useAuth();
    const location = useLocation();
    //Showing loading spinner while checking auth
    if(loading){
        return (
            <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-green-50 to-white">
                <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-500
                                border-t-transparent rounded-full animate-spin
                                mx-auto mb-4" />
                <p className="text-gray-600 text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    //Not logged in : Navigating to the login page
    if(!isAuthenticated){
        return <Navigate to='/login' state={{from: location}} replace/>;
    } 

    //Logged in but no profile (and profile required)
    if(requireProfile && !hasProfile){
        return <Navigate to='/profile/create' replace/>;
    }

    return <>{children}</>;
    
}

export default ProtectedRoute;



