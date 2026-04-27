const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  age: { type: Number }, // Auto-calculated in pre-save or frontend
  policyNumber: { type: String, required: true },
  password: { type: String, required: true },
  bloodGroup: { type: String },

  // Emergency Contact
  emergencyName: { type: String },
  emergencyPhone: { type: String },
  emergencyPin: { type: String }, // 4 digit

  // Medical Info
  conditions: {
    diabetes: { type: Boolean, default: false },
    asthma: { type: Boolean, default: false },
    epilepsy: { type: Boolean, default: false },
    heartCondition: { type: Boolean, default: false },
    bp: { type: Boolean, default: false },
    other: { type: String }
  },

  allergies: {
    medicines: { type: String },
    food: { type: String },
    other: { type: String }
  },

  medications: [
    {
      name: { type: String },
      dosage: { type: String }
    }
  ],

  history: {
    surgeries: { type: String },
    injuries: { type: String },
    implants: { type: String }
  },

  special: {
    pregnancy: { type: Boolean, default: false },
    disability: { type: String }
  },

  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password and calculate age
UserSchema.pre('save', async function(next) {
  const user = this;
  
  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }

  if (user.isModified('dob') || user.isNew) {
    const dob = new Date(user.dob);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    user.age = Math.abs(age_dt.getUTCFullYear() - 1970);
  }

  next();
});

module.exports = mongoose.model('User', UserSchema);
