// api/createAdmin.js
require('dotenv').config({ path: './.env' }); // Assurez-vous que le chemin vers .env est correct
const mongoose = require('mongoose');
const User = require('./src/models/User'); // Chemin vers votre modèle User

const createAdminUser = async () => {
  const adminEmail = 'admin@leonceouattara.com'; // <<< CHANGEZ CET EMAIL SI NÉCESSAIRE
  const adminPassword = 'AdminPassword123!'; // <<< CHANGEZ CE MOT DE PASSE (DOIT ÊTRE FORT)
  const adminFirstName = 'Leonce';
  const adminLastName = 'Ouattara';

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for admin creation.');

    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      console.log('Current user details:');
      console.log('- Email:', adminUser.email);
      console.log('- Role:', adminUser.role);
      console.log('- Active:', adminUser.isActive);
      console.log('- Email Verified:', adminUser.emailVerified);
      
      // Mettre à jour le mot de passe si nécessaire
      adminUser.password = adminPassword; // Le hook pre-save de Mongoose le hashéra
      adminUser.role = 'admin';
      adminUser.isActive = true;
      adminUser.emailVerified = true;
      await adminUser.save();
      console.log('Admin user updated with new password and admin role.');
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
    }
    
    console.log('\n=== IDENTIFIANTS ADMIN ===');
    console.log('Email:', adminEmail);
    console.log('Mot de passe:', adminPassword);
    console.log('========================\n');
    console.log('Vous pouvez maintenant vous connecter à /admin/login avec ces identifiants.');
    console.log('IMPORTANT: Supprimez ce fichier après utilisation pour des raisons de sécurité.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\nERREUR DE CONNEXION À MONGODB:');
      console.log('- Vérifiez que MongoDB est en cours d\'exécution');
      console.log('- Vérifiez la variable MONGODB_URI dans votre fichier .env');
      console.log('- Si vous utilisez Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    }
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

createAdminUser();