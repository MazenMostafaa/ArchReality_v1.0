
import jwt from 'jsonwebtoken'

// ===================== generation Function ===============


// NOTE : you must send an object (as a parameter) When you're calling this function. 
export const generateToken = ({
    payload = {}, // object
    signature = process.env.DEFAULT_SIGNATURE,
    expiresIn = '1d'
} = {}) => {

    // check if the payload is empty object
    if (!Object.keys(payload).length) {
        return false
        // NOTE : if this case happens ,where you're using this generation Fun you must detect after using it
        // if token has generated or not. 
    }

    const token = jwt.sign(payload, signature, { expiresIn })

    return token
}

// =========================  Verify Function ==============================
export const verifyToken = ({
    token = '',
    signature = process.env.DEFAULT_SIGNATURE,
} = {}) => {

    // check if the token is empty string
    if (!token) {
        return false
        // NOTE : if this case happens ,where you're using this verify Fun you must detect after using it
        // if token has verified or not.
    }
    const data = jwt.verify(token, signature)
    return data
}