const data = [
    // Executive Leadership (core)
    { name: 'Prof. Jyoti Kumar', role: 'Editor-in-Chief', email: 'jyotikumar1ru@gmail.com', memberType: 'core', order: 1 },
    { name: 'Prof. Arun Kumar', role: 'Managing Editor', email: 'prf.arunkumar@gmail.com', memberType: 'core', order: 2 },
    { name: 'Dr. Nayni Saxena', role: 'Executive Editor', email: 'naynisaxena@gmail.com', memberType: 'core', order: 3 },
    { name: 'Mr. Rahul Ranjan', role: 'Editor', email: 'rahulranjan.03@gmail.com', memberType: 'core', order: 4 },

    // National Advisory Editors (national_advisory)
    { name: 'Prof. Neelima Gupta', role: 'National Advisory Editor', department: 'Zoology', location: 'Bareilly', memberType: 'national_advisory', order: 5 },
    { name: 'Prof. Kamini Kumar', role: 'National Advisory Editor', department: 'Botany', location: 'P.V.C., K.U.', memberType: 'national_advisory', order: 6 },
    { name: 'Prof. N. Banerjee', role: 'National Advisory Editor', department: 'Botany', location: 'Santiniketan', memberType: 'national_advisory', order: 7 },
    { name: 'Dr. R. Ramani', role: 'National Advisory Editor', department: 'IINRG', location: 'Ranchi', memberType: 'national_advisory', order: 8 },
    { name: 'Dr. Janardan Jee', role: 'National Advisory Editor', department: 'Zool./PS, ICAR', location: 'Patna', memberType: 'national_advisory', order: 9 },
    { name: 'Prof. Amarjeet Singh', role: 'National Advisory Editor', department: 'Botany', location: 'Patiala', memberType: 'national_advisory', order: 10 },
    { name: 'Prof. A. Nagpal', role: 'National Advisory Editor', department: 'Botany', location: 'Amritsar', memberType: 'national_advisory', order: 11 },
    { name: 'Prof. K.L. Tiwari', role: 'National Advisory Editor', department: 'Botany', location: 'Raipur', memberType: 'national_advisory', order: 12 },
    { name: 'Prof. Partha P. Barua', role: 'National Advisory Editor', department: 'Botany', location: 'Gauhati', memberType: 'national_advisory', order: 13 },
    { name: 'Dr. Ajit Kr. Sinha', role: 'National Advisory Editor', department: 'Zoology', location: 'V.C., R.U.', memberType: 'national_advisory', order: 14 },
    { name: 'Prof. M. C. Dash', role: 'National Advisory Editor', department: 'Zoology', location: 'Bhubaneshwar', memberType: 'national_advisory', order: 15 },
    { name: 'Prof. N.K. Dubey', role: 'National Advisory Editor', department: 'Botany', location: 'Varanasi', memberType: 'national_advisory', order: 16 },
    { name: 'Prof. H.P. Puttaraju', role: 'National Advisory Editor', department: 'Zoology', location: 'Bangalore', memberType: 'national_advisory', order: 17 },
    { name: 'Prof. P. Nath', role: 'National Advisory Editor', department: 'Zoology', location: 'Patna', memberType: 'national_advisory', order: 18 },
    { name: 'Dr. C.S. Gururaj', role: 'National Advisory Editor', department: 'Sericulture', location: 'Bangalore', memberType: 'national_advisory', order: 19 },
    { name: 'Dr. P. K. Mahapatra', role: 'National Advisory Editor', department: 'Botany', location: 'Cuttack', memberType: 'national_advisory', order: 20 },
    { name: 'Prof. R. K. Pandey', role: 'National Advisory Editor', department: 'Botany', location: 'Ex-V.C., R.U.', memberType: 'national_advisory', order: 21 },
    { name: 'Dr. R. K. Gambhir Singh', role: 'National Advisory Editor', department: 'Zoology', location: 'Manipur', memberType: 'national_advisory', order: 22 },
    { name: 'Prof. Prahlad Dubey', role: 'National Advisory Editor', department: 'Zoology', location: 'Kota', memberType: 'national_advisory', order: 23 },
    { name: 'Dr. R.C. Mohanty', role: 'National Advisory Editor', department: 'Botany', location: 'Bhubaneshwar', memberType: 'national_advisory', order: 24 },

    // National Editors (national_editor)
    { name: 'Dr. Uma Shanker Singh', role: 'National Editor (D.Sc, IFS)', memberType: 'national_editor', order: 25 },
    { name: 'Dr. Noor Alam', role: 'National Editor', department: 'Zoology', location: 'Giridih', memberType: 'national_editor', order: 26 },
    { name: 'Dr. Jatinder Kaur', role: 'National Editor', department: 'Botany', location: 'Amritsar', memberType: 'national_editor', order: 27 },
    { name: 'Dr. S. M. Shamim', role: 'National Editor', department: 'Zoology', location: 'Ranchi', memberType: 'national_editor', order: 28 },
    { name: 'Dr. Satyendra Kumar', role: 'National Editor', department: 'Zoology', location: 'Hajipur', memberType: 'national_editor', order: 29 },
    { name: 'Dr. Rani Srivastava', role: 'National Editor', department: 'Zoology', location: 'Patna', memberType: 'national_editor', order: 30 },
    { name: 'Prof. Chandrawati Jee', role: 'National Editor', department: 'Biotech.', location: 'Patna', memberType: 'national_editor', order: 31 },
    { name: 'Dr. D. K. Paul', role: 'National Editor', department: 'Zoology', location: 'Patna', memberType: 'national_editor', order: 32 },
    { name: 'Prof. Arun Kumar Mitra', role: 'National Editor', department: 'Microbiology', location: 'Kolkata', memberType: 'national_editor', order: 33 },
    { name: 'Prof. Amritesh Shukla', role: 'National Editor', department: 'Botany', location: 'Lucknow', memberType: 'national_editor', order: 34 },
    { name: 'Prof. A. Hore', role: 'National Editor', department: 'Zoology', location: 'Ranchi', memberType: 'national_editor', order: 35 },
    { name: 'Prof. Kunul Kandir', role: 'National Editor', department: 'Botany', location: 'Ranchi', memberType: 'national_editor', order: 36 },
    { name: 'Dr. S. Nehar', role: 'National Editor', department: 'Zoology', location: 'Ranchi', memberType: 'national_editor', order: 37 },
    { name: 'Dr. Arbind Kumar', role: 'National Editor', department: 'Zoology', location: 'Patna', memberType: 'national_editor', order: 38 },
    { name: 'Prof. P. K. Mohanthy', role: 'National Editor', department: 'Zoology', location: 'Bhubaneshwar', memberType: 'national_editor', order: 39 },
    { name: 'Dr. Seema Keshari', role: 'National Editor', department: 'Zoology', location: 'R.U., Ranchi', memberType: 'national_editor', order: 40 },
    { name: 'Prof. S. C. Mandal', role: 'National Editor', department: 'Pharmacognosy', location: 'Kolkata', memberType: 'national_editor', order: 41 },
    { name: 'Prof. T. C. Narendran', role: 'National Editor', department: 'Zoology', location: 'Calicut', memberType: 'national_editor', order: 42 },
    { name: 'Dr. A. K. Panigrahi', role: 'National Editor', department: 'Zoology', location: 'Kalyani', memberType: 'national_editor', order: 43 },
    { name: 'Dr. A. D. Jadhav', role: 'National Editor', department: 'Sericulture', location: 'Nagpur', memberType: 'national_editor', order: 44 },
    { name: 'Dr. Shashi P. Agarwal', role: 'National Editor', department: 'Zoology', location: 'Kanpur', memberType: 'national_editor', order: 45 },
    { name: 'Prof. H. P. Sharma', role: 'National Editor', department: 'Botany', location: 'R.U., Ranchi', memberType: 'national_editor', order: 46 },
    { name: 'Dr. Abha Prasad', role: 'National Editor', department: 'Zoology', location: 'R.W.C. Ranchi', memberType: 'national_editor', order: 47 },
    { name: 'Dr. Anand Kumar Thakur', role: 'National Editor', department: 'Zoology', location: 'R.U., Ranchi', memberType: 'national_editor', order: 48 },
    { name: 'Prof. Habibur Rahman', role: 'National Editor', department: 'Botany', location: 'Santiniketan', memberType: 'national_editor', order: 49 },
    { name: 'Dr. Anupam Dikshit', role: 'National Editor', department: 'Botany', location: 'Allahabad', memberType: 'national_editor', order: 50 },
    { name: 'Dr. Sushma Das Guru', role: 'National Editor', department: 'Botany', location: 'Ranchi', memberType: 'national_editor', order: 51 },
    { name: 'Dr. A. K. Srivastava', role: 'National Editor', department: 'Botany', location: 'Ranchi', memberType: 'national_editor', order: 52 },
    { name: 'Dr. Vinod Kumar', role: 'National Editor', department: 'Agri.', location: 'Sr. Sci., Dharwad', memberType: 'national_editor', order: 53 },
    { name: 'Dr. R.D. Raviya', role: 'National Editor', department: 'Life Sci.', location: 'Gujarat', memberType: 'national_editor', order: 54 },
    { name: 'Dr. Prasanjit Mukherjee', role: 'National Editor', department: 'Botany', location: 'Gumla', memberType: 'national_editor', order: 55 },
    { name: 'Dr. Ashok Kumar Nag', role: 'National Editor', department: 'Botany', location: 'Ranchi', memberType: 'national_editor', order: 56 },

    // Foreign Editors (foreign_editor)
    { name: 'Prof. (Dr.) G.H.R. Rao', role: 'Foreign Editor', location: 'UM, Minneapolis, USA', memberType: 'foreign_editor', order: 57 },
    { name: 'Prof. S. I. Shalaby', role: 'Foreign Editor', location: 'Cairo, Egypt', memberType: 'foreign_editor', order: 58 },
    { name: 'Prof. Narendra Pd. Singh', role: 'Foreign Editor', location: 'Columbia, USA', memberType: 'foreign_editor', order: 59 },
    { name: 'Dr. Pascalis Harizanis', role: 'Foreign Editor', location: 'Athens, Greece', memberType: 'foreign_editor', order: 60 },
    { name: 'Dr. Ajit Bharti', role: 'Foreign Editor', department: 'Zoology', location: 'Boston', memberType: 'foreign_editor', order: 61 },
    { name: 'Dr. V.R.P. Sinha', role: 'Foreign Editor', location: 'Pittsburg, USA', memberType: 'foreign_editor', order: 62 },
    { name: 'Dr. V.K. Gupta', role: 'Foreign Editor', location: 'UG, Ireland', memberType: 'foreign_editor', order: 63 },
    { name: 'Dr. Jerry L. Kaster', role: 'Foreign Editor', location: 'UW, Milwaukee, USA', memberType: 'foreign_editor', order: 64 },

    // Strategic Resourcing Team (strategic)
    { name: 'Dr. Astha Kiran', role: 'President, MSET-ICCB', memberType: 'strategic', order: 65 },
    { name: 'Mrs. Pali Vasudha', role: 'Secretary, MSET-ICCB', memberType: 'strategic', order: 66 },
    { name: 'Mr. P. Prabudh', role: 'Corporate Planner, USA', memberType: 'strategic', order: 67 },
    { name: 'Mrs. B. Nanjudaiah', role: 'Corporate Adviser, USA', memberType: 'strategic', order: 68 },
    { name: 'Mr. R. Ranjan', role: 'Corporate Planner, USA', memberType: 'strategic', order: 69 },
    { name: 'Mrs. R. Narayan', role: 'Corporate Adviser, USA', memberType: 'strategic', order: 70 },
    { name: 'Dr. Ranjit Ranjan', role: 'Expert, Language & Lit.', memberType: 'strategic', order: 71 },
    { name: 'Mr. Ravi Rahul Singh', role: 'Office Admin. Editor', memberType: 'strategic', order: 72 }
];

async function upload() {
    try {
        const response = await fetch('http://localhost:5000/api/editorial/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Upload successful:', result.length, 'members added.');
        } else {
            console.error('Upload failed:', result);
        }
    } catch (error) {
        console.error('Upload failed:', error.message);
    }
}

upload();
