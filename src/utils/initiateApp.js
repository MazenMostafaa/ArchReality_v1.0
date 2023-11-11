import { dbConnection } from "../../db/connection.js"
import { globalResponse } from "./errorHandler.js"
import cors from 'cors'
import { corsOptions } from "./corsPolicy.js"

export const initiateApp = (app, express) => {

    const port = +process.env.PORT || 5000

    // connection of DB
    dbConnection()

    // allow cors policy on your APIs
    // app.use(cors())   this means you allow all (domains or IPs) to get access.

    app.use(cors(corsOptions)) // this means you allow a specific (domains or IPs) to get access.

    // parsing any requested data
    app.use(express.json())

    // default router
    app.get('/', (req, res) => res.status(200).json('Hello from graduation folder!'))


    //  Section Requests On RESTful APIs

    // Global response for any (expected) fail case 
    app.use(globalResponse)

    // router in case there's no routers match
    app.all('*', (req, res) => { res.status(404).json({ Message: "404 Not fount URL" }) })



    app.listen(port, () => { console.log(`...Server is running on Port ${port}`); })
}