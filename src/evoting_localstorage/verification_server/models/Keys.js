const mongoose = require('mongoose');
const dbConnection = require('./connection');

const keysSchema = new mongoose.Schema({
  election_id: { type: Number, unique: true, required: true },
  alpha: { type: String, required: true },
  pai_pk: { type: [mongoose.Schema.Types.Mixed], required: true },
  _pai_sklist: { type: [mongoose.Schema.Types.Mixed], required: true },
  pai_pklist_single: { type: [mongoose.Schema.Types.Mixed], required: true },
  _pai_sklist_single: { type: [mongoose.Schema.Types.Mixed], required: true },
  elg_pk: { type: [mongoose.Schema.Types.Mixed], required: true },
  _elg_sklist: { type: [mongoose.Schema.Types.Mixed], required: true },
  ck: { type: [mongoose.Schema.Types.Mixed], required: true },
  ck_fo: { type: [mongoose.Schema.Types.Mixed], required: true },
  _pi: { type: [mongoose.Schema.Types.Mixed], required: true },
  _re_pi: { type: [mongoose.Schema.Types.Mixed], required: true },
  _svecperm: { type: [mongoose.Schema.Types.Mixed], required: true },
  permcomm: { type: [mongoose.Schema.Types.Mixed], required: true },
  beaver_a_shares: { type: [mongoose.Schema.Types.Mixed], required: true },
  beaver_b_shares: { type: [mongoose.Schema.Types.Mixed], required: true },
  beaver_c_shares: { type: [mongoose.Schema.Types.Mixed], required: true },
});

const generatorSchema = new mongoose.Schema({
  election_id: { type: Number, unique: true, required: true },
  g1: { type: String, required: true },
  f2: { type: String, required: true },
  eg1f2: { type: String, required: true },
  ef1f2: { type: String, required: true },
  f1: { type: String, required: true },
  h1: { type: String, required: true },
  eh1f2: { type: String, required: true },
  idenT: { type: String, required: true },
  inveh1f2: { type: String, required: true },
  inveg1f2: { type: String, required: true },
  fT: { type: String, required: true },
});

const Keys = dbConnection.model('Keys', keysSchema);
const Generator = dbConnection.model('Generator', generatorSchema);

module.exports = { Keys, Generator };
