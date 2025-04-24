db = db.getSiblingDB('test');

db.admins.insertOne({
  email: "adoni@admin.iitd.ac.in",
  password: "$2a$10$tmueC/GjtHOF6E8P88qVcOuwkf.PLzCptp/eZCprL8wTvlnGbOTCC" //hash for adoni@1234
});
