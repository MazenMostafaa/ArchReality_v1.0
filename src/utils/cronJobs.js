import { scheduleJob } from "node-schedule"
import { userModel } from "../../db/models/userModel.js"
import { adminModel } from "../../db/models/adminModel.js"

export const checkConfirmedUser = () => {
    scheduleJob('0 0 0 */2 *', async function () {

        const users = await userModel.find({ isConfirmed: false })
        const admins = await adminModel.find({ isConfirmed: false })

        for (const user of users) {
            console.log(user);
            await userModel.findByIdAndDelete(user._id)
        }
        for (const admin of admins) {
            console.log(admin);
            await adminModel.findByIdAndDelete(admin._id)
        }
        console.log("CRon job is running now.....");
        console.log("users aren't confirmed their account have deleted from the system permanently");
    })
}