import mongoose from "mongoose";

export const dbConnection = async () => {
    return await mongoose
        .connect(process.env.DB_local_CONNECTION_URL)
        .then((res) => { console.log("Connection has been established successfully"); })
        .catch((error) => { console.log(error) })

}