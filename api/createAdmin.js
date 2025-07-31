// api/createAdmin.js
require('dotenv').config({ path: './.env' }); // Assurez-vous que le chemin vers .env est correct
const mongoose = require('mongoose');
const User = require('./src/models/User'); // Chemin vers votre modèle User

const createAdminUser = async () => {
  const adminEmail = 'admin@example.com'; // <<< CHANGEZ CET EMAIL
  const adminPassword = 'AdminPassword123!'; // <<< CHANGEZ CE MOT DE PASSE (DOIT ÊTRE FORT)
  const adminFirstName = 'Admin';
  const adminLastName = 'User';

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for admin creation.');

    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      // Si l'utilisateur existe déjà, vous pouvez choisir de mettre à jour son mot de passe
      // adminUser.password = adminPassword; // Le hook pre-save de Mongoose le hashéra
      // await adminUser.save();
      // console.log('Admin user password updated.');
    } else {
      adminUser = await User.create({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword, // Le hook pre-save de Mongoose hashéra ce mot de passe
        role: 'admin',
        isActive: true,
        emailVerified: true // Supposons que l'email est vérifié pour un admin créé manuellement
      });
      console.log(`Admin user ${adminEmail} created successfully!`);
      console.log('Please remember your password:', adminPassword);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

createAdminUser();
