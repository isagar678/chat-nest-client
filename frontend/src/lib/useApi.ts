import AuthContext from "@/context/AuthContext"
import axios from "axios";
import { useContext, useEffect, useRef } from "react"


const API_BASE = 'http://localhost:3000';

export const useApi = () => {
    const { accessToken } = useContext(AuthContext)
    const apiRef = useRef(axios.create({
        baseURL: API_BASE,
        withCredentials: true,
    }));

    useEffect(() => {
        // Update the Authorization header whenever accessToken changes
        if (accessToken) {
            apiRef.current.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } else {
            delete apiRef.current.defaults.headers.common['Authorization'];
        }
    }, [accessToken]);

    return apiRef.current;
}