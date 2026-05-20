-- Update existing students with realistic names
-- Run this in Prisma Studio or your database client

-- Update John Doe to Kunal Joshi
UPDATE students 
SET name = 'Kunal Joshi',
    email = '24me050@charusat.edu.in',
    phone = '9156715214',
    "studentId" = 'ME2023001',
    department = 'ME',
    semester = 4,
    "currentCGPA" = 6.8,
    "attendancePercent" = 58,
    "dropoutRisk" = 'HIGH'
WHERE name = 'John Doe';

-- Update Jane Smith to Priya Sharma  
UPDATE students
SET name = 'Priya Sharma',
    email = '24cs089@charusat.edu.in',
    phone = '9876543210',
    "studentId" = 'CS2023089',
    department = 'CS',
    semester = 6,
    "currentCGPA" = 7.2,
    "attendancePercent" = 72,
    "dropoutRisk" = 'MEDIUM'
WHERE name = 'Jane Smith';
