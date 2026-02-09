import mongoose, { Document, Schema } from "mongoose";

export interface IScheme extends Document {
    name: string,// Pradhan Mantri Kisan Nidhi Yojana
    shortName: string,// PM-Kisan
    ministry?: string,
}