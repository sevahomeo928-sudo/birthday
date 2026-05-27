export interface BirthdayPerson {
  name: string;
  roastMessage: string;
  birthDate: string;
}

export interface Sender {
  id: string;
  name: string;
  message: string;
  special: 'CS' | 'None';
}

export const defaultBirthdayPerson: BirthdayPerson = {
  name: "Chotu",
  roastMessage: "Abe nalle, ek aur saal barbaad kar diya tune. Zindagi mein kuch dhang ka kaam kar le ab. Chal koi na, tu jaisa bhi hai mera bhai hai. Happy Birthday! 🎉 Party de chup chap.",
  birthDate: "March 14th"
};

export const defaultSenders: Sender[] = [
  { id: '1', name: 'Ashish', message: 'sudo make-wish --name=friend --force\nconsole.log("Happy Bday bhai");', special: 'CS' },
  { id: '2', name: 'Aditya', message: 'Bhai tu sudhrega nahi na? Happy Birthday! Ghoomne chalte hain.', special: 'None' },
  { id: '3', name: 'Rohit', message: 'Aaj toh naha leta gadhe! Chal khush reh, Happy bday.', special: 'None' }
];
