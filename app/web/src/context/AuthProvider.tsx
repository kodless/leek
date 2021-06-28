import React, {useState, useEffect} from 'react'
import {Spin, message} from 'antd';

import env from "../utils/vars";
import getFirebase from '../utils/firebase';
import Auth from '../containers/Auth'

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
    /** =======================
     *  gRPC Service Callbacks
     ---------------------- **/
    const [firebase, setFirebase] = useState();
    const [loading, setLoading] = useState<boolean>(true);
    const [bootstrapping, setBootstrapping] = useState<boolean>(true);
    const [user, setUser] = useState<any>(null);


    /** =======================
     *  gRPC Service Calls
     ---------------------- **/
    function login() {
        if (!firebase) return;
        setLoading(true);
        // @ts-ignore
        let provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        // @ts-ignore
        firebase.auth().signInWithPopup(provider).then(function (result) {
            setUser(result.user);
            setLoading(false)
        }).catch(function (error) {
            console.log(error.message);
            message.error("Unable to sign in");
            setLoading(false)
        });
    }

    function logout() {
        if (firebase === undefined) return;

        // @ts-ignore
        firebase.auth().signOut().then(function () {

        }).catch(function (error) {
            console.log(error)
        });
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
            const fb = getFirebase();
            setFirebase(fb);
            fb.auth().onAuthStateChanged((user) => {
                setUser(user);
                setBootstrapping(false);
                setLoading(false);
            });
        }
    }, []);

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
