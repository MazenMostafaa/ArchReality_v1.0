import { systemRoles } from '../../utils/systemRoles.js'

export const adminApisRole = {
    CREATE: [systemRoles.ADMIN],
    DELETE: [systemRoles.ADMIN],
    UPDATE: [systemRoles.ADMIN],
    LIST: [systemRoles.ADMIN],
    LISTPROJECTS: [systemRoles.ADMIN, systemRoles.CLIENT],
}