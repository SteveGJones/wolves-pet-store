import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

console.log('Connecting to database...');
const pool = new Pool({ connectionString: DATABASE_URL });

async function seedData() {
  try {
    console.log("Starting to seed database...");

    // Add pet categories (or get existing ones)
    const categoriesResult = await pool.query(`
      INSERT INTO pet_categories (name, description) VALUES
      ('Dogs', 'Loyal and loving canine companions'),
      ('Cats', 'Independent and affectionate feline friends'),
      ('Birds', 'Colorful and intelligent feathered pets'),
      ('Small Animals', 'Rabbits, guinea pigs, and other small pets'),
      ('Reptiles', 'Fascinating cold-blooded companions'),
      ('Fish', 'Beautiful aquatic pets for all experience levels')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
    `);
    
    // If categories already existed, get them
    let categories = categoriesResult.rows;
    if (categories.length === 0) {
      const existingCategoriesResult = await pool.query(`
        SELECT id, name FROM pet_categories ORDER BY id;
      `);
      categories = existingCategoriesResult.rows;
    }
    
    console.log('Categories available:', categories.length);

    // Add sample pets for each category
    const dogCategoryId = categories[0].id;
    const catCategoryId = categories[1].id;
    const birdCategoryId = categories[2].id;
    const smallAnimalCategoryId = categories[3].id;
    const reptileCategoryId = categories[4].id;

    // Insert pets one by one to avoid parameter issues
    const pets = [
      // Dogs
      ['Buddy', dogCategoryId, 'Golden Retriever', 'Adult', 'Large', 'Male', 'Golden', 'Friendly and energetic Golden Retriever who loves playing fetch.', 'Friendly, energetic, loyal', 250.00, 'available', true, true],
      ['Charlie', dogCategoryId, 'German Shepherd', 'Young', 'Large', 'Male', 'Black and Tan', 'Intelligent and loyal German Shepherd mix for active families.', 'Intelligent, loyal, protective', 300.00, 'available', true, true],
      ['Bella', dogCategoryId, 'Labrador Mix', 'Young', 'Medium', 'Female', 'Chocolate', 'Energetic and playful Labrador mix who loves meeting people.', 'Playful, social, energetic', 225.00, 'available', true, true],
      
      // Cats
      ['Whiskers', catCategoryId, 'Domestic Shorthair', 'Young', 'Medium', 'Female', 'Tabby', 'Sweet and gentle cat who loves to cuddle and purr.', 'Gentle, affectionate, calm', 150.00, 'available', true, true],
      ['Oliver', catCategoryId, 'Maine Coon', 'Adult', 'Large', 'Male', 'Orange', 'Majestic Maine Coon with fluffy coat and gentle personality.', 'Gentle, calm, independent', 200.00, 'available', true, true],
      ['Shadow', catCategoryId, 'Black Cat', 'Young', 'Medium', 'Male', 'Black', 'Sleek black cat with bright green eyes, playful and affectionate.', 'Playful, affectionate, curious', 125.00, 'available', true, true],
      
      // Birds
      ['Sunny', birdCategoryId, 'Cockatiel', 'Young', 'Small', 'Male', 'Yellow and Gray', 'Charming cockatiel who loves to whistle and learn tunes.', 'Social, musical, friendly', 150.00, 'available', false, true],
      ['Rio', birdCategoryId, 'Conure', 'Adult', 'Medium', 'Female', 'Green and Red', 'Vibrant green-cheeked conure with playful personality.', 'Playful, colorful, vocal', 300.00, 'available', false, true],
      
      // Small Animals
      ['Coco', smallAnimalCategoryId, 'Holland Lop Rabbit', 'Young', 'Small', 'Female', 'Brown and White', 'Adorable Holland Lop rabbit with floppy ears, litter trained.', 'Gentle, quiet, sweet', 100.00, 'available', true, true],
      ['Peanut', smallAnimalCategoryId, 'Guinea Pig', 'Adult', 'Small', 'Male', 'Tri-color', 'Social guinea pig who loves to popcorn when excited.', 'Social, active, vocal', 50.00, 'available', true, false],
      
      // Reptiles
      ['Scales', reptileCategoryId, 'Bearded Dragon', 'Adult', 'Medium', 'Male', 'Brown and Orange', 'Calm bearded dragon who enjoys basking under heat lamp.', 'Calm, docile, easy-care', 200.00, 'available', false, false],
      ['Emerald', reptileCategoryId, 'Leopard Gecko', 'Young', 'Small', 'Female', 'Yellow with Black Spots', 'Beautiful leopard gecko with distinctive spots, nocturnal.', 'Nocturnal, gentle, easy-care', 150.00, 'available', false, false]
    ];

    for (const pet of pets) {
      await pool.query(`
        INSERT INTO pets (name, category_id, breed, age, size, gender, color, description, temperament, adoption_fee, status, is_neutered, is_vaccinated) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, pet);
    }
    
    console.log('Sample pets created successfully!');
    console.log('Database seeded with categories and pets.');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedData().catch(console.error);