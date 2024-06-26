const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const MonAmiChatHistory = require("./monAmiChatHistory");
const crypto = require("crypto");

const personalInfoSchema = new mongoose.Schema({
  firstName: { type: String, required: true, lowercase: true },
  lastName: { type: String, required: true, lowercase: true },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
});

const immigrationInfoSchema = new mongoose.Schema({
  countryOfOrigin: { type: String, required: true },
  currentImmigrationStatus: { type: String, required: true },
  dateOfImmigration: { type: Date, required: true },
  visaType: { type: String, required: true },
  typeOfStatus: { type: String, required: true },
});

const languageProficiencySchema = new mongoose.Schema({
  assessment: [
    {
      listening: { type: String, required: true },
      reading: { type: String, required: true },
      speaking: { type: String, required: true },
      writing: { type: String, required: true },
    },
  ],
});

const educationAndEmploymentSchema = new mongoose.Schema({
  highestLevelOfEducation: { type: String, required: true },
  previousWorkExperience: { type: String, required: true },
  aspirations: { type: String, required: true },
});

const housingSituationSchema = new mongoose.Schema({
  currentHousingSituation: { type: String, required: true },
  housingPreference: { type: String },
});

const familyInfoSchema = new mongoose.Schema({
  numOfFamilyMembers: { type: Number, required: true, default: 0 },
  relationship: { type: String, required: true, default: null },
});

const socialIntegrationSchema = new mongoose.Schema({
  interestsAndHobbies: { type: String, required: true, default: null },
  preferredSocialActivities: { type: String, required: true, default: null }, //preferred social activiies for meeting new people.
  ethos: { type: String, default: null }, // cultural or social inclinations
});
const supportNeedsSchema = new mongoose.Schema({
  challenges: { type: String }, //specific challengesrelated to immigrations and settlement
  supportServices: { type: String, default: null }, //support services or resources
});

const profileSchema = new mongoose.Schema({
  name: { type: String },
  preferences: { type: String }, //temporary structure. to be revisited i decide which AI processing to use.
});
const searchHistorySchema = new mongoose.Schema({
  searchQuery: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  personalInfo: personalInfoSchema,
  immigrationInfo: immigrationInfoSchema,
  languageProficiency: languageProficiencySchema,
  educationAndEmployment: educationAndEmploymentSchema,
  housingSituation: housingSituationSchema,
  familyInfo: familyInfoSchema,
  socialIntegration: socialIntegrationSchema,
  supportNeeds: supportNeedsSchema,
  profile: profileSchema,
  searchHistory: [searchHistorySchema],
  monAmiChatHistory: [
    { type: mongoose.Schema.Types.ObjectId, ref: "MonAmiChatHistory" },
  ],
  profilePicture: { type: String },
  passwordResetToken: { type: String },
  tokenExpires: { type: Date },
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.tokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = uuidv4();
  }
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("personalInfo.password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.personalInfo.password, salt);

    this.personalInfo.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.pre("save", function (next) {
  if (!this.profile) {
    this.profile = {};
  }
  if (!this.profile.name) {
    this.profile.name = this.personalInfo.firstName;
  }

  next();
});
const Users = mongoose.model("User", userSchema);

module.exports = Users;
