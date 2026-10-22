import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  email: { type: String, required: true, trim: true, lowercase: true, minlength: 3 },
  team: { type: Schema.Types.ObjectId, ref: 'Team', default: undefined },
  fitnessGoal: { type: String, required: true, trim: true, minlength: 1 },
});

export const User = model('User', userSchema);
