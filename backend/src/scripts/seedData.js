const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');
const InventoryItem = require('../models/InventoryItem');
const Book = require('../models/Book');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    await Asset.deleteMany({});
    await InventoryItem.deleteMany({});
    await Book.deleteMany({});
    console.log('Cleared existing data');

// Add this to your seedData.js file when creating departments
const departments = await Department.create([
  { 
    name: 'General Studies', 
    nameAm: 'አጠቃላይ ጥናቶች', 
    code: 'GS', 
    building: 'Main Building', 
    floor: '1st Floor',
    email: 'gs@campus.edu',
    phone: '0912345690',
    budget: { annual: 100000, remaining: 100000 }
  },
  { 
    name: 'Computer Science', 
    nameAm: 'ኮምፒውተር ሳይንስ', 
    code: 'CS', 
    building: 'Main Building', 
    floor: '3rd Floor',
    email: 'cs@campus.edu',
    phone: '0912345678',
    budget: { annual: 500000, remaining: 500000 }
  },
  // ... other departments
]);

    // Create asset categories
    const categories = await AssetCategory.create([
      { name: 'Computer', nameAm: 'ኮምፒውተር', code: 'COM', depreciationRate: 20, expectedLifespan: 5, icon: '💻', color: '#3b82f6' },
      { name: 'Laptop', nameAm: 'ላፕቶፕ', code: 'LAP', depreciationRate: 25, expectedLifespan: 4, icon: '🖥️', color: '#10b981' },
      { name: 'Furniture', nameAm: 'ቤት እቃ', code: 'FUR', depreciationRate: 10, expectedLifespan: 10, icon: '🪑', color: '#f59e0b' },
      { name: 'Lab Equipment', nameAm: 'ላብራቶሪ መሳሪያ', code: 'LAB', depreciationRate: 15, expectedLifespan: 8, icon: '🔬', color: '#ef4444' },
      { name: 'Projector', nameAm: 'ፕሮጀክተር', code: 'PRO', depreciationRate: 20, expectedLifespan: 6, icon: '📽️', color: '#8b5cf6' }
    ]);

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@campus.edu',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      phone: '0912345682'
    });

    // Create HOD users
    const hodUsers = [];
    for (const dept of departments) {
      const hodPassword = await bcrypt.hash('Hod123!', 12);
      const hod = await User.create({
        name: `Dr. ${dept.name} Head`,
        email: `hod.${dept.code.toLowerCase()}@campus.edu`,
        password: hodPassword,
        department: dept._id,
        role: 'hod',
        employeeId: `HOD${dept.code}`,
        isActive: true,
        phone: `09123456${departments.indexOf(dept) + 83}`
      });
      hodUsers.push(hod);
      
      // Update department with HOD
      dept.hod = hod._id;
      await dept.save();
    }

    // Create staff users
    const staffUsers = [];
    for (let i = 1; i <= 6; i++) {
      const staffPassword = await bcrypt.hash('Staff123!', 12);
      const staff = await User.create({
        name: `Staff Member ${i}`,
        email: `staff${i}@campus.edu`,
        password: staffPassword,
        department: departments[Math.floor(Math.random() * departments.length)]._id,
        role: 'staff',
        employeeId: `STAFF${String(i).padStart(3, '0')}`,
        isActive: true,
        phone: `09123456${90 + i}`
      });
      staffUsers.push(staff);
    }

    // Create student users
    const studentUsers = [];
    for (let i = 1; i <= 20; i++) {
      const studentPassword = await bcrypt.hash('Student123!', 12);
      const student = await User.create({
        name: `Student ${i}`,
        email: `student${i}@campus.edu`,
        password: studentPassword,
        department: departments[Math.floor(Math.random() * departments.length)]._id,
        role: 'student',
        studentId: `STU${String(i).padStart(4, '0')}`,
        isActive: true,
        phone: `09123456${String(i).padStart(2, '0')}`
      });
      studentUsers.push(student);
    }

    // Create sample assets
    const sampleAssets = [];
    const statuses = ['available', 'checked-out', 'maintenance'];
    const locations = ['Room 101', 'Lab 202', 'Office 305', 'Library', 'Auditorium'];
    
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const purchaseYear = 2020 + Math.floor(Math.random() * 4);
      
      sampleAssets.push({
        assetTag: `${category.code}-${String(i).padStart(5, '0')}`,
        name: `${category.name} ${i}`,
        description: `High-quality ${category.name.toLowerCase()} for ${department.name} department`,
        category: category._id,
        department: department._id,
        location: locations[Math.floor(Math.random() * locations.length)],
        status: status,
        purchaseDate: new Date(purchaseYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        purchasePrice: Math.floor(Math.random() * 100000) + 10000,
        serialNumber: `SN${Math.random().toString(36).substring(7).toUpperCase()}`,
        manufacturer: ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Sony'][Math.floor(Math.random() * 6)],
        model: `Model-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`,
        notes: `Asset #${i} - Regular maintenance recommended`
      });
    }
    
    await Asset.create(sampleAssets);

    // Create inventory items
    const inventoryItems = [
      { name: 'A4 Paper', category: 'Stationery', quantity: 500, unit: 'reams', minimumQuantity: 50, unitPrice: 250, location: 'Store Room A' },
      { name: 'Printer Toner', category: 'IT Supplies', quantity: 30, unit: 'cartridges', minimumQuantity: 10, unitPrice: 1500, location: 'Store Room B' },
      { name: 'Whiteboard Markers', category: 'Stationery', quantity: 200, unit: 'pieces', minimumQuantity: 50, unitPrice: 35, location: 'Store Room A' },
      { name: 'Cleaning Detergent', category: 'Cleaning', quantity: 100, unit: 'liters', minimumQuantity: 20, unitPrice: 120, location: 'Cleaning Closet' },
      { name: 'Hand Sanitizer', category: 'Cleaning', quantity: 50, unit: 'bottles', minimumQuantity: 15, unitPrice: 80, location: 'Store Room B' },
      { name: 'Lab Gloves', category: 'Lab Supplies', quantity: 1000, unit: 'pairs', minimumQuantity: 100, unitPrice: 5, location: 'Lab Storage' },
      { name: 'USB Drives', category: 'IT Supplies', quantity: 80, unit: 'pieces', minimumQuantity: 20, unitPrice: 300, location: 'IT Store' },
      { name: 'Notebooks', category: 'Stationery', quantity: 300, unit: 'pieces', minimumQuantity: 50, unitPrice: 45, location: 'Store Room A' },
      { name: 'Coffee Supplies', category: 'Cafe Supplies', quantity: 40, unit: 'kg', minimumQuantity: 10, unitPrice: 600, location: 'Cafe Storage' },
      { name: 'Projector Bulbs', category: 'Maintenance', quantity: 15, unit: 'pieces', minimumQuantity: 5, unitPrice: 3500, location: 'Maintenance Room' }
    ];

    for (const item of inventoryItems) {
      const sku = `${item.category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      await InventoryItem.create({ ...item, sku });
    }

    // Create library books
    const books = [
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Textbook', totalCopies: 10, location: 'A-101', publisher: 'MIT Press', publishYear: 2009 },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Textbook', totalCopies: 8, location: 'A-102', publisher: 'Prentice Hall', publishYear: 2008 },
      { title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '9780201616224', category: 'Textbook', totalCopies: 6, location: 'A-103', publisher: 'Addison-Wesley', publishYear: 1999 },
      { title: 'Design Patterns', author: 'Erich Gamma', isbn: '9780201633610', category: 'Reference', totalCopies: 5, location: 'B-201', publisher: 'Addison-Wesley', publishYear: 1994 },
      { title: 'ህብረተሰብ እና ባህል', nameAm: 'ህብረተሰብ እና ባህል', author: 'በላይ አድማስ', category: 'Fiction', totalCopies: 15, location: 'C-301', publisher: 'አዲስ አበባ ዩኒቨርሲቲ', publishYear: 2015, language: 'am' }
    ];

    for (const book of books) {
      await Book.create(book);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('═'.repeat(50));
    console.log('👑 Admin:');
    console.log('   Email: admin@campus.edu');
    console.log('   Password: Admin123!');
    console.log('\n📚 Department Heads:');
    for (const dept of departments) {
      console.log(`   ${dept.name}: hod.${dept.code.toLowerCase()}@campus.edu / Hod123!`);
    }
    console.log('\n👨‍💼 Staff:');
    console.log('   staff1@campus.edu / Staff123!');
    console.log('   staff2@campus.edu / Staff123!');
    console.log('   ...');
    console.log('\n👨‍🎓 Students:');
    console.log('   student1@campus.edu / Student123!');
    console.log('   student2@campus.edu / Student123!');
    console.log('   ...');
    console.log('\n📊 Statistics:');
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Asset Categories: ${categories.length}`);
    console.log(`   - Assets: ${sampleAssets.length}`);
    console.log(`   - Inventory Items: ${inventoryItems.length}`);
    console.log(`   - Books: ${books.length}`);
    console.log(`   - Users: ${1 + hodUsers.length + staffUsers.length + studentUsers.length}`);
    console.log('\n✅ Seeding completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
