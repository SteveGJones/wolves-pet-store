import { db } from "../server/db.js";
import { petCategories, pets } from "../shared/schema.js";

async function seedData() {
  try {
    console.log("Starting to seed database...");

    // Add pet categories
    const categories = await db.insert(petCategories).values([
      { name: 'Dogs', description: 'Loyal and loving canine companions' },
      { name: 'Cats', description: 'Independent and affectionate feline friends' },
      { name: 'Birds', description: 'Colorful and intelligent feathered pets' },
      { name: 'Small Animals', description: 'Rabbits, guinea pigs, and other small pets' }
    ]).returning();
    
    console.log('Categories created:', categories.length);

    // Add sample pets
    const samplePets = await db.insert(pets).values([
      {
        name: 'Buddy',
        categoryId: categories[0].id,
        breed: 'Golden Retriever',
        age: 'Adult',
        size: 'Large',
        gender: 'Male',
        color: 'Golden',
        description: 'Buddy is a friendly and energetic Golden Retriever who loves playing fetch and swimming. He is great with kids and other dogs.',
        temperament: 'Friendly, energetic, loyal',
        adoptionFee: '250.00',
        status: 'available',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop'],
        tags: ['family-friendly', 'good-with-kids', 'house-trained']
      },
      {
        name: 'Whiskers',
        categoryId: categories[1].id,
        breed: 'Domestic Shorthair',
        age: 'Young',
        size: 'Medium',
        gender: 'Female',
        color: 'Tabby',
        description: 'Whiskers is a sweet and gentle cat who loves to cuddle and purr. She enjoys sunny windowsills and interactive toys.',
        temperament: 'Gentle, affectionate, calm',
        adoptionFee: '150.00',
        status: 'available',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop'],
        tags: ['indoor-cat', 'lap-cat', 'quiet']
      },
      {
        name: 'Charlie',
        categoryId: categories[0].id,
        breed: 'German Shepherd',
        age: 'Young',
        size: 'Large',
        gender: 'Male',
        color: 'Black and Tan',
        description: 'Charlie is an intelligent and loyal German Shepherd mix looking for an active family. He knows basic commands and loves long walks.',
        temperament: 'Intelligent, loyal, protective',
        adoptionFee: '300.00',
        status: 'available',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1551717743-49959800b1f6?w=500&h=400&fit=crop'],
        tags: ['needs-exercise', 'intelligent', 'guard-dog']
      },
      {
        name: 'Luna',
        categoryId: categories[1].id,
        breed: 'Maine Coon',
        age: 'Adult',
        size: 'Large',
        gender: 'Female',
        color: 'Gray and White',
        description: 'Luna is a majestic Maine Coon with a fluffy coat and gentle personality. She loves being brushed and enjoys quiet companionship.',
        temperament: 'Gentle, calm, independent',
        adoptionFee: '200.00',
        status: 'available',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=500&h=400&fit=crop'],
        tags: ['long-haired', 'quiet', 'independent']
      },
      {
        name: 'Rocky',
        categoryId: categories[0].id,
        breed: 'Bulldog',
        age: 'Senior',
        size: 'Medium',
        gender: 'Male',
        color: 'Brindle',
        description: 'Rocky is a sweet senior bulldog who enjoys leisurely walks and lots of belly rubs. He would be perfect for a calm household.',
        temperament: 'Calm, affectionate, gentle',
        adoptionFee: '175.00',
        status: 'available',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop'],
        tags: ['senior', 'calm', 'good-with-seniors']
      },
      {
        name: 'Bella',
        categoryId: categories[0].id,
        breed: 'Labrador Mix',
        age: 'Young',
        size: 'Medium',
        gender: 'Female',
        color: 'Chocolate',
        description: 'Bella is an energetic and playful Labrador mix who loves meeting new people and other dogs. She would thrive in an active family.',
        temperament: 'Playful, social, energetic',
        adoptionFee: '225.00',
        status: 'pending',
        isNeutered: true,
        isVaccinated: true,
        imageUrls: ['https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500&h=400&fit=crop'],
        tags: ['energetic', 'social', 'family-friendly']
      }
    ]).returning();
    
    console.log('Pets created:', samplePets.length);
    console.log('Sample data seeded successfully!');
    console.log('Created pets:', samplePets.map(p => p.name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();