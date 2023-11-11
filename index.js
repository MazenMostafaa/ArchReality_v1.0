import express from 'express'
import path from 'path'
import { config } from 'dotenv'
import { initiateApp } from './src/utils/initiateApp.js'

const app = express()
config({ path: path.resolve('./config/config.env') })

initiateApp(app, express)


