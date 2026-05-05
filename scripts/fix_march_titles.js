const mongoose = require('mongoose');
require('dotenv').config();

const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Year = require('../models/Year');

const updates = [
  {
    pages: '1-6',
    title: 'Effect of DDT on the protein and free amino acids concentration of the ovary, fat bodies and muscles in adult female, Dysdercus cingulatus (Hemiptera : Pyrrhocoridae)',
    authors: 'S.M. Mahboob Hassan & Seema Kumari'
  },
  {
    pages: '7-12',
    title: 'Endohelminthic parasite diversity in piscine host of Madhepura district, Bihar, India',
    authors: 'Chandan Kumar Chand & Arun Kumar'
  },
  {
    pages: '13-16',
    title: 'Investigation of inhibition of protein denaturation assay by chitosan extracted from exoskeleton of Sartoriana spinigera (Wood-Mason, 1871)',
    authors: 'Khushboo Tigga, Upasana Marandi & Suhasini Besra'
  },
  {
    pages: '17-20',
    title: 'Antibacterial activity of chitosan of freshwater crab, Maydelliathelphusa masoniana (Henderson, 1893) against Staphylococcus aureus and Escherichia coli',
    authors: 'Pulin Kerketta, Kumari Neetu & Suhasini Besra'
  },
  {
    pages: '21-26',
    title: 'Socio economic and aesthetic paradigms of lady bugs’ diversity',
    authors: 'Neetu Kumari & Mahendra Prasad'
  },
  {
    pages: '27-30',
    title: 'Effects of deltamethrin on some haematological parameters of Heteropneustes fossilis (Bloch)',
    authors: 'Ragini Ranu & Arun Kumar'
  },
  {
    pages: '31-36',
    title: 'A taxonomic study of shell fishes in Madhepura, North Bihar',
    authors: 'Shashi Prabha & Arun Kumar'
  },
  {
    pages: '37-40',
    title: 'Study about the presence and damage caused by whiteflies on sunflower',
    authors: 'Mausam Kumari & Arun Kumar'
  },
  {
    pages: '41-42',
    title: 'Arsenic toxicity and its epigenetic mechanisms',
    authors: 'Kumari Soni & Arun Kumar'
  },
  {
    pages: '43-46',
    title: 'Effect of Colchicine in the treatment of gout and primary biliary cirrhosis',
    authors: 'Biospectra Researchers'
  },
  {
    pages: '47-50',
    title: 'Effect of an organophosphate pesticide in the ovulation of air breathing fish Anabas testudineus (Bloch, 1792)',
    authors: 'Sushma Swaraj'
  },
  {
    pages: '51-54',
    title: 'Morphology of worm snake Typhlina bramina',
    authors: 'Kumari Ranjana & Arun Kumar'
  },
  {
    pages: '55-60',
    title: 'Effect of temperature on the population density of aquatic insects',
    authors: 'Ruchi Mala & Arun Kumar'
  },
  {
    pages: '61-64',
    title: 'A taxonomic study on the aquatic insect of order coleopteran found in Jharkhand',
    authors: 'Sulekha Kumari'
  },
  {
    pages: '65-68',
    title: 'Species diversity of shellfishes in Madhepura district of Bihar',
    authors: 'Shashi Prabha & Arun Kumar'
  },
  {
    pages: '69-72',
    title: 'Effect of organophosphate on testicular cycle of male Anabas testudineus',
    authors: 'Sushma Swaraj'
  },
  {
    pages: '73-76',
    title: 'Bioethanol production from renewable raw materials wheat straw and waste vegetables',
    authors: 'Dinesh Krishna & Arun Kumar'
  },
  {
    pages: '77-80',
    title: 'Studies on behavior of common baron Euthalia aconthea (1.08%) globally threatened species in peninsular India',
    authors: 'Sulekha Kumari'
  },
  {
    pages: '81-84',
    title: 'Studies on callus induction of Murraya koenigii Spreng in auxin and cytokinin',
    authors: 'Nazra Paiker & Kunul Kandir'
  },
  {
    pages: '85-88',
    title: 'Ethnobotany and the Sacred Divine Plant: Tulsi',
    authors: 'Kumari Smita'
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const yearDoc = await Year.findOne({ year: 2019 });
  const issueDoc = await Issue.findOne({ year: yearDoc._id, title: 'March Issue' });

  for (let update of updates) {
    const article = await Article.findOneAndUpdate(
      { issue: issueDoc._id, pages: update.pages },
      { title: update.title, authors: update.authors },
      { new: true }
    );
    if (article) {
        console.log(`Updated pages ${update.pages} -> ${update.title.substring(0,30)}...`);
    } else {
        console.log(`COULD NOT FIND pages ${update.pages}`);
    }
  }

  console.log('Finished updating titles and authors for March 2019.');
  process.exit(0);
}

run().catch(console.error);
