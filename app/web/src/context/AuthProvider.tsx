import React, {useState, useEffect} from 'react'
import {Spin, message} from 'antd';

import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "firebase/auth"

import env from "../utils/vars";
import getAuth from '../utils/firebase';
import Auth from '../containers/Auth'
import {useThemeSwitcher} from "react-css-theme-switcher";

interface AuthContextData {
    user: any;
    loading: boolean;

    login();

    logout();
}

const initial = {
    user: null,
};

const AuthContext = React.createContext<AuthContextData>(initial as AuthContextData);


function AuthProvider({children}) {
    const { status } = useThemeSwitcher();


    /** =======================
     *  gRPC Service Callbacks
     ---------------------- **/
    const [auth, setAuth] = useState<any>();
    const [loading, setLoading] = useState<boolean>(true);
    const [bootstrapping, setBootstrapping] = useState<boolean>(true);
    const [user, setUser] = useState<any>(null);


    /** =======================
     *  gRPC Service Calls
     ---------------------- **/
    function login() {
        if (!auth) return;
        setLoading(true)
        const provider = new GoogleAuthProvider()
        signInWithPopup(auth, provider)
            .then(function (result) {
                setUser(result.user)
                setLoading(false)
            })
            .catch(function (error: any) {
                console.log(error.message)
                message.error("Unable to sign in")
                setLoading(false)
            })
    }

    function logout() {
        if (auth === undefined) return;
        signOut(auth)
            .then(function () {
                // Sign-out successful.
            })
            .catch(function (error: any) {
                console.log(error)
            })
    }

    /** ======================
     *  Hooks
     ---------------------- */
    useEffect(() => {
        if (env.LEEK_API_ENABLE_AUTH === "false") {
            setBootstrapping(false);
            setLoading(false);
        }
        else {
            setBootstrapping(true);
            setLoading(true);
            const authentication = getAuth();
            setAuth(authentication);
            onAuthStateChanged(authentication, (user: any) => {
                setUser(user)
                setBootstrapping(false)
                setLoading(false)
            })
        }
    }, []);

    // Avoid theme change flicker
    if (status === "loading") {
        return null;
    }

    return (
        <AuthContext.Provider value={
            {
                user: user,
                loading: loading,
                login: login,
                logout: logout
            }
        }>
            {
                env.LEEK_API_ENABLE_AUTH === "false" ? children : user ? children : bootstrapping ?
                    <Spin spinning={loading} size="large" style={{
                        width: "100%",
                        height: "100vh",
                        lineHeight: "100vh"
                    }}/> :
                    <Auth/>
            }
        </AuthContext.Provider>
    )
}

const useAuth = () => React.useContext(AuthContext);
export {AuthProvider, useAuth}
