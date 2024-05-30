import { Router } from "express";
import { asyncHandler } from "../../utils/errorHandler.js";
import * as Ac from './admin.controller.js'
import { validationFunction } from '../../middlewares/validation.js'
import * as validator from './admin.validationSchema.js'
import { adminAuth } from '../../middlewares/auth.js'
import { adminApisRole } from './admin.endPoints.js'
import { multerCloudFunction } from '../../services/multerCloudService.js'
import { allowedExtensions } from '../../utils/multerAllowedExtensions.js'

const router = Router()

//              ==========> Admin Auth Routes <============
router.post('/mainAccount', asyncHandler(Ac.mainAccount))

router.post('/createAccount',
    adminAuth(adminApisRole.CREATE),
    validationFunction(validator.createSchema),
    asyncHandler(Ac.createAdmin))

router.get('/confirmEmail/:token', asyncHandler(Ac.confirmEmail))

router.post('/login', validationFunction(validator.loginSchema), asyncHandler(Ac.login))

router.put('/update',
    adminAuth(adminApisRole.UPDATE),
    multerCloudFunction(allowedExtensions.Image).single("profile"),
    validationFunction(validator.updateSchema),
    asyncHandler(Ac.updateAdmin))

router.get('/listAccounts', adminAuth(adminApisRole.LIST), asyncHandler(Ac.listAccounts))

router.delete('/deleteAcc/:id',
    adminAuth(adminApisRole.DELETE),
    asyncHandler(Ac.deleteAcc))

//              ==========> Projects Management Routes <============

router.post('/addProj',
    multerCloudFunction(allowedExtensions.Image)
        .fields([
            { name: 'Images' },
            { name: 'ARmodel', maxCount: 1 }
        ]),
    adminAuth(adminApisRole.CREATE),
    validationFunction(validator.AddProjSchema),
    asyncHandler(Ac.addProj))

router.put('/updateProj',
    adminAuth(adminApisRole.UPDATE),
    multerCloudFunction(allowedExtensions.Image)
        .fields([
            { name: 'Images' },
            { name: 'ARmodel', maxCount: 1 }
        ]),
    validationFunction(validator.updateProjSchema),
    asyncHandler(Ac.updateProj))

router.delete('/deleteProj/:projectId',
    adminAuth(adminApisRole.DELETE),
    asyncHandler(Ac.deleteProj))

router.get('/listProj', adminAuth(adminApisRole.LISTPROJECTS), asyncHandler(Ac.listProj))

export default router