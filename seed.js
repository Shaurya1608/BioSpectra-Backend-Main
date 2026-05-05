const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Editorial = require('./models/Editorial');
const About = require('./models/About');

dotenv.config();

const editorialData = [
    // Executive Editorial Team
    { name: 'Prof. Jyoti Kumar', role: 'Editor-in-Chief', email: 'jyotikumar1ru@gmail.com', memberType: 'core', order: 1 },
    { name: 'Prof. Arun Kumar', role: 'Managing Editor', email: 'prf.arunkumar@gmail.com', memberType: 'core', order: 2 },
    { name: 'Dr. Nayni Saxena', role: 'Executive Editor', email: 'naynisaxena@gmail.com', memberType: 'core', order: 3 },
    { name: 'Mr. Rahul Ranjan', role: 'Editor', email: 'rahulranjan.03@gmail.com', memberType: 'core', order: 4 },
    
    // National Advisory Editors
    { name: "Prof. Neelima Gupta", department: "Zoology", location: "Bareilly", memberType: "national_advisory", role: "Advisory Editor", order: 10 },
    { name: "Prof. Kamini Kumar", department: "Botany", location: "P.V.C., K.U.", memberType: "national_advisory", role: "Advisory Editor", order: 11 },
    { name: "Prof. N. Banerjee", department: "Botany", location: "Santiniketan", memberType: "national_advisory", role: "Advisory Editor", order: 12 },
    { name: "Dr. R. Ramani", department: "IINRG", location: "Ranchi", memberType: "national_advisory", role: "Advisory Editor", order: 13 },
    { name: "Dr. Janardan Jee", department: "Zool./PS, ICAR", location: "Patna", memberType: "national_advisory", role: "Advisory Editor", order: 14 },
    { name: "Prof. Amarjeet Singh", department: "Botany", location: "Patiala", memberType: "national_advisory", role: "Advisory Editor", order: 15 },
    { name: "Prof. A. Nagpal", department: "Botany", location: "Amritsar", memberType: "national_advisory", role: "Advisory Editor", order: 16 },
    { name: "Prof. K.L.Tiwari", department: "Botany", location: "Raipur", memberType: "national_advisory", role: "Advisory Editor", order: 17 },
    { name: "Prof. Partha P. Barua", department: "Botany", location: "Gauhati", memberType: "national_advisory", role: "Advisory Editor", order: 18 },
    { name: "Dr. Ajit Kr. Sinha", department: "Zoology", location: "V.C., R.U.", memberType: "national_advisory", role: "Advisory Editor", order: 19 },
    { name: "Prof. M. C. Dash", department: "Zoology", location: "Bhubaneshwar", memberType: "national_advisory", role: "Advisory Editor", order: 20 },
    { name: "Prof. N.K.Dubey", department: "Botany", location: "Varanasi", memberType: "national_advisory", role: "Advisory Editor", order: 21 },
    { name: "Prof.H.P.Puttaraju", department: "Zoology", location: "Bangalore", memberType: "national_advisory", role: "Advisory Editor", order: 22 },
    { name: "Prof. P. Nath", department: "Zoology", location: "Patna", memberType: "national_advisory", role: "Advisory Editor", order: 23 },
    { name: "Dr. C.S.Gururaj", department: "Sericulture", location: "Bangalore", memberType: "national_advisory", role: "Advisory Editor", order: 24 },
    { name: "Dr. P. K. Mahapatra", department: "Botany", location: "Cuttack", memberType: "national_advisory", role: "Advisory Editor", order: 25 },
    { name: "Prof. R. K. Pandey", department: "Botany", location: "Ex-V.C., R.U.", memberType: "national_advisory", role: "Advisory Editor", order: 26 },
    { name: "Dr. R. K. Gambhir Singh", department: "Zoology", location: "Manipur", memberType: "national_advisory", role: "Advisory Editor", order: 27 },
    { name: "Prof. Prahlad Dubey", department: "Zoology", location: "Kota", memberType: "national_advisory", role: "Advisory Editor", order: 28 },
    { name: "Dr. R.C. Mohanty", department: "Botany", location: "Bhubaneshwar", memberType: "national_advisory", role: "Advisory Editor", order: 29 },

    // National Editors
    { name: "Dr. Uma Shanker Singh", role: "D.Sc, IFS", memberType: "national_editor", order: 50 },
    { name: "Dr. Noor Alam", department: "Zoology", location: "Giridih", memberType: "national_editor", role: "National Editor", order: 51 },
    { name: "Dr. Jatinder Kaur", department: "Botany", location: "Amritsar", memberType: "national_editor", role: "National Editor", order: 52 },
    { name: "Dr. S. M. Shamim", department: "Zoology", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 53 },
    { name: "Dr. Satyendra Kumar", department: "Zoology", location: "Hajipur", memberType: "national_editor", role: "National Editor", order: 54 },
    { name: "Dr. Rani Srivastava", department: "Zoology", location: "Patna", memberType: "national_editor", role: "National Editor", order: 55 },
    { name: "Prof. Chandrawati Jee", department: "Biotech.", location: "Patna", memberType: "national_editor", role: "National Editor", order: 56 },
    { name: "Dr. D. K. Paul", department: "Zoology", location: "Patna", memberType: "national_editor", role: "National Editor", order: 57 },
    { name: "Prof. Arun Kumar Mitra", department: "Microbiology", location: "Kolkata", memberType: "national_editor", role: "National Editor", order: 58 },
    { name: "Prof. Amritesh Shukla", department: "Botany", location: "Lucknow", memberType: "national_editor", role: "National Editor", order: 59 },
    { name: "Prof. A. Hore", department: "Zoology", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 60 },
    { name: "Prof. Kunul Kandir", department: "Botany", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 61 },
    { name: "Dr. S. Nehar", department: "Zoology", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 62 },
    { name: "Dr. Arbind Kumar", department: "Zoology", location: "Patna", memberType: "national_editor", role: "National Editor", order: 63 },
    { name: "Prof. P. K. Mohanthy", department: "Zoology", location: "Bhubaneshwar", memberType: "national_editor", role: "National Editor", order: 64 },
    { name: "Dr. Seema Keshari", department: "Zoology", location: "R.U., Ranchi", memberType: "national_editor", role: "National Editor", order: 65 },
    { name: "Prof. S. C. Mandal", department: "Pharmacognosy", location: "Kolkata", memberType: "national_editor", role: "National Editor", order: 66 },
    { name: "Prof. T. C. Narendran", department: "Zoology", location: "Calicut", memberType: "national_editor", role: "National Editor", order: 67 },
    { name: "Dr. A. K. Panigrahi", department: "Zoology", location: "Kalyani", memberType: "national_editor", role: "National Editor", order: 68 },
    { name: "Dr. A. D. Jadhav", department: "Sericulture", location: "Nagpur", memberType: "national_editor", role: "National Editor", order: 69 },
    { name: "Dr. Shashi P. Agarwal", department: "Zoology", location: "Kanpur", memberType: "national_editor", role: "National Editor", order: 70 },
    { name: "Prof. H. P. Sharma", department: "Botany", location: "R.U., Ranchi", memberType: "national_editor", role: "National Editor", order: 71 },
    { name: "Dr. Abha Prasad", department: "Zoology", location: "R.W.C. Ranchi", memberType: "national_editor", role: "National Editor", order: 72 },
    { name: "Dr. Anand Kumar Thakur", department: "Zoology", location: "R.U., Ranchi", memberType: "national_editor", role: "National Editor", order: 73 },
    { name: "Prof. Habibur Rahman", department: "Botany", location: "Santiniketan", memberType: "national_editor", role: "National Editor", order: 74 },
    { name: "Dr. Anupam Dikshit", department: "Botany", location: "Allahabad", memberType: "national_editor", role: "National Editor", order: 75 },
    { name: "Dr. Sushma Das Guru", department: "Botany", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 76 },
    { name: "Dr. A. K. Srivastava", department: "Botany", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 77 },
    { name: "Dr. Vinod Kumar", department: "Agri.", location: "Sr. Sci., Dharwad", memberType: "national_editor", role: "National Editor", order: 78 },
    { name: "Dr. R.D. Raviya", department: "Life Sci.", location: "Gujarat", memberType: "national_editor", role: "National Editor", order: 79 },
    { name: "Dr. Prasanjit Mukherjee", department: "Botany", location: "Gumla", memberType: "national_editor", role: "National Editor", order: 80 },
    { name: "Dr. Ashok Kumar Nag", department: "Botany", location: "Ranchi", memberType: "national_editor", role: "National Editor", order: 81 },

    // Foreign Editors
    { name: "Prof. (Dr.) G.H.R. Rao", location: "UM, Minneapolis, USA", memberType: "foreign_editor", role: "Foreign Editor", order: 100 },
    { name: "Prof. S. I. Shalaby", location: "Cairo, Egypt", memberType: "foreign_editor", role: "Foreign Editor", order: 101 },
    { name: "Prof. Narendra Pd. Singh", location: "Columbia, USA", memberType: "foreign_editor", role: "Foreign Editor", order: 102 },
    { name: "Dr. Pascalis Harizanis", location: "Athens, Greece", memberType: "foreign_editor", role: "Foreign Editor", order: 103 },
    { name: "Dr. Ajit Bharti", department: "Zoology", location: "Boston", memberType: "foreign_editor", role: "Foreign Editor", order: 104 },
    { name: "Dr. V.R.P. Sinha", location: "Pittsberg, USA", memberType: "foreign_editor", role: "Foreign Editor", order: 105 },
    { name: "Dr. V.K. Gupta", location: "UG, Ireland", memberType: "foreign_editor", role: "Foreign Editor", order: 106 },
    { name: "Dr. Jerry L. Kaster", location: "UW, Milwaukee, USA", memberType: "foreign_editor", role: "Foreign Editor", order: 107 },
    
    // Strategic Resourcing Team
    { name: "Dr. Astha Kiran", role: "President, MSET-ICCB", memberType: "strategic", order: 200 },
    { name: "Mrs. Pali Vasudha", role: "Secretary, MSET-ICCB", memberType: "strategic", order: 201 },
    { name: "Mr. P. Prabudh", role: "Corporate Planner, USA", memberType: "strategic", order: 202 },
    { name: "Mrs. B. Nanjudaiah", role: "Corporate Adviser, USA", memberType: "strategic", order: 203 },
    { name: "Mr. R. Ranjan", role: "Corporate Planner, USA", memberType: "strategic", order: 204 },
    { name: "Mrs. R. Narayan", role: "Corporate Adviser, USA", memberType: "strategic", order: 205 },
    { name: "Dr. Ranjit Ranjan", role: "Expert, Language & Lit.", memberType: "strategic", order: 206 },
    { name: "Mr. Ravi Rahul Singh", role: "Office Admin. Editor", memberType: "strategic", order: 207 }
];

const aboutData = [
    {
        title: "Madhawi Shyam Educational Trust",
        content: "Excellence in Scientific Research",
        sectionType: "hero",
        order: 1
    },
    {
        title: "Founders of MSET",
        content: "Prof. (Dr.) Mahendra Prasad & Mrs. Pali Vasudha",
        sectionType: "founder",
        images: ["/assets/madhavi.jpg"],
        order: 2
    },
    {
        title: "Our History",
        content: "The trust, Madhawi Shyam Educational Trust (MSET) was established on 30th Nov. 2005 under the Trust Registration Act at Ranchi. It was founded by Late Prof. (Dr.) Mahendra Prasad, a Senior Professor of Zoology at Ranchi University, and Mrs. Pali Vasudha, retired Asst. Director (OL) of BSNL, in fond memory of their parents.",
        sectionType: "history",
        order: 3
    },
    {
        title: "Official Publication",
        content: "BIOSPECTRA: ISSN-0973-7057. An International Biannual Refereed Journal of Life Sciences",
        sectionType: "publication",
        images: ["/logo/Biospectra-logo.jpg.jpeg"],
        order: 4
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');
        
        await Editorial.deleteMany({});
        await About.deleteMany({});
        
        await Editorial.insertMany(editorialData);
        await About.insertMany(aboutData);
        
        console.log('Data seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
