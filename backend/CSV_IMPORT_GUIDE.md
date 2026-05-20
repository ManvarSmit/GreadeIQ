# Student CSV Import Template

## Overview
This CSV template matches **exactly** the fields in the "Add Student" modal form. Use this format to bulk import student data.

## CSV Format

### Required Fields (marked with *)
- `studentId` * - Unique student enrollment ID
- `name` * - Full name of the student
- `email` * - Email address (must be unique)
- `department` * - Department name
- `semester` * - Current semester (1-8)

### Optional Fields

#### Personal Information
- `phone` - Contact number
- `dateOfBirth` - Format: YYYY-MM-DD (e.g., 2003-05-15)
- `gender` - Options: Male, Female, Other, Prefer not to say

#### Academic Information
- `currentCGPA` - CGPA value (0.0 to 10.0)
- `attendancePercent` - Attendance percentage (0 to 100)

#### Family & Socioeconomic
- `familyIncome` - Annual family income
- `parentEducation` - Options: No Formal Education, Primary, Secondary, Higher Secondary, Graduate, Post Graduate
- `distanceFromHome` - Distance in kilometers

#### Behavioral Data
- `libraryVisits` - Number of library visits per month
- `extracurricular` - true or false
- `disciplinaryIssues` - Number of disciplinary issues

#### Fee Information
- `totalFees` - Total fees amount
- `feesPaid` - Amount already paid
- `feesPending` - Pending amount
- `paymentStatus` - Options: PAID, PARTIAL, PENDING, OVERDUE

## Sample CSV Header

```csv
studentId,name,email,phone,dateOfBirth,gender,department,semester,currentCGPA,attendancePercent,familyIncome,parentEducation,distanceFromHome,libraryVisits,extracurricular,disciplinaryIssues,totalFees,feesPaid,feesPending,paymentStatus
```

## Example Row

```csv
CS2024001,Rahul Kumar,rahul@university.edu,9876543210,2003-05-15,Male,Computer Science,3,8.5,92,500000,Graduate,15,45,true,0,120000,80000,40000,PARTIAL
```

## Important Notes

1. **Field Order**: The CSV columns MUST be in the exact order shown above
2. **Required Fields**: studentId, name, email, department, and semester must have values
3. **Empty Fields**: Leave optional fields empty if no data available (e.g., `,,` for consecutive empty fields)
4. **Boolean Values**: Use `true` or `false` (lowercase) for extracurricular field
5. **Date Format**: Use YYYY-MM-DD format for dateOfBirth
6. **No Spaces**: Avoid extra spaces in field values unless part of the actual data
7. **Encoding**: Save the file as UTF-8 encoding

## Department Options
- Computer Science
- Electronics
- Mechanical
- Civil
- Electrical
- Information Technology

## Parent Education Options
- No Formal Education
- Primary
- Secondary
- Higher Secondary
- Graduate
- Post Graduate

## Payment Status Options
- PAID - Fully paid
- PARTIAL - Partially paid
- PENDING - Not yet paid
- OVERDUE - Payment overdue

## Sample File Location
A complete sample CSV file is available at:
`backend/test-data/students-sample.csv`

## How to Use

1. Download the sample CSV file
2. Open in Excel or Google Sheets
3. Replace sample data with your actual student data
4. Save as CSV (UTF-8)
5. Upload via Data Management page → "Upload CSV" button

## Validation Rules

- **Email**: Must be valid email format and unique
- **CGPA**: Must be between 0 and 10
- **Attendance**: Must be between 0 and 100
- **Semester**: Must be between 1 and 8
- **Phone**: Optional, but if provided should be valid
- **Fees**: totalFees = feesPaid + feesPending (system will validate)
