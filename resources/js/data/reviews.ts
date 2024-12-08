export interface Review {
    id: string;
    author: string;
    rating: number;
    date: string;
    title: string;
    content: string;
    verified?: boolean;
    location?: string;
  }
  
  export const reviews: Review[] = [
  {
      id: '1',
      author: 'Robert Anderson',
      rating: 5,
      date: '1 day ago',
      title: 'Outstanding Value for Premium Software',
      content: 'Saved our company thousands on software licenses. The instant delivery and activation process was flawless. Their enterprise support team was extremely helpful with volume licensing questions.',
      verified: true,
      location: 'United States'
  },
  {
      id: '2',
      author: 'Emma Thompson',
      rating: 5,
      date: '3 days ago',
      title: 'Excellent Service and Pricing',
      content: 'We equipped our entire startup with premium licenses at an amazing price point. The process was quick and the customer service was exceptional. Will definitely be back for more.',
      verified: true,
      location: 'Canada'
  },
  {
      id: '3',
      author: 'David Chen',
      rating: 4,
      date: '1 week ago',
      title: 'Great Deals on Professional Software',
      content: 'Found the best prices for professional licenses here. The only minor hiccup was a slight delay in activation, but support resolved it quickly.',
      verified: true,
      location: 'Singapore'
  },
  {
      id: '4',
      author: 'Lisa Martinez',
      rating: 5,
      date: '1 week ago',
      title: 'Seamless Enterprise Experience',
      content: 'Managing software licenses for our 200+ employee company has never been easier. Their enterprise portal is intuitive and the bulk pricing is excellent.',
      verified: true,
      location: 'Spain'
  },
  {
      id: '5',
      author: 'James Wilson',
      rating: 5,
      date: '2 weeks ago',
      title: 'Reliable and Cost-effective',
      content: 'Been using their services for over a year now. The savings are significant and every license has been genuine with full manufacturer support.',
      verified: true,
      location: 'Australia'
  },
  {
      id: '6',
      author: 'Sophie Laurent',
      rating: 4,
      date: '2 weeks ago',
      title: 'Professional and Efficient',
      content: 'Competitive pricing on enterprise licenses. The support team was knowledgeable and helped us choose the right package for our needs.',
      verified: true,
      location: 'France'
  },
  {
      id: '7',
      author: 'Marcus Schmidt',
      rating: 5,
      date: '3 weeks ago',
      title: 'Perfect for Small Businesses',
      content: 'As a small business owner, finding affordable software licenses was crucial. This platform delivered exactly what we needed at prices we could afford.',
      verified: true,
      location: 'Germany'
  },
  {
      id: '8',
      author: 'Patricia O\'Connor',
      rating: 5,
      date: '3 weeks ago',
      title: 'Outstanding Customer Service',
      content: 'Had some questions about enterprise licensing, and their support team went above and beyond to help. The savings were substantial too.',
      verified: true,
      location: 'Ireland'
  },
  {
      id: '9',
      author: 'Alexander Petrov',
      rating: 4,
      date: '1 month ago',
      title: 'Reliable License Provider',
      content: 'Quick delivery of business software. Documentation was clear and implementation was straightforward. Would recommend for any business needs.',
      verified: true,
      location: 'Russia'
  },
  {
      id: '10',
      author: 'Maria Garcia',
      rating: 5,
      date: '1 month ago',
      title: 'Excellent Enterprise Solutions',
      content: 'The enterprise support package is worth every penny. They helped us migrate our entire organization to new software seamlessly.',
      verified: true,
      location: 'Mexico'
  },
  {
      id: '11',
      author: 'Thomas Wright',
      rating: 5,
      date: '1 month ago',
      title: 'Best Price Guarantee Really Works',
      content: 'Found lower prices elsewhere and they matched it instantly. The customer service is incredible and the delivery was immediate.',
      verified: true,
      location: 'United Kingdom'
  },
  {
      id: '12',
      author: 'Anna Kowalski',
      rating: 4,
      date: '1 month ago',
      title: 'Great Value for Money',
      content: 'The savings were significant compared to direct purchases. Everything works perfectly and support is always available when needed.',
      verified: true,
      location: 'Poland'
  },
  {
      id: '13',
      author: 'Henrik Nielsen',
      rating: 5,
      date: '2 months ago',
      title: 'Smooth Licensing Process',
      content: 'Everything from purchase to activation was straightforward. The dashboard makes license management a breeze.',
      verified: true,
      location: 'Denmark'
  },
  {
      id: '14',
      author: 'Isabella Romano',
      rating: 5,
      date: '2 months ago',
      title: 'Exceptional Support Team',
      content: 'Their 24/7 support is truly remarkable. Any questions or issues are resolved quickly and professionally.',
      verified: true,
      location: 'Italy'
  },
  {
      id: '15',
      author: 'Lucas Silva',
      rating: 4,
      date: '2 months ago',
      title: 'Very Satisfied Customer',
      content: 'The platform is user-friendly and the prices are unbeatable. Minor improvement needed in the search functionality.',
      verified: true,
      location: 'Brazil'
  },
  {
      id: '16',
      author: 'Sarah Johnson',
      rating: 5,
      date: '2 months ago',
      title: 'Time and Money Saver',
      content: 'Saved both time and money getting our licenses through this platform. The bulk discount options are excellent.',
      verified: true,
      location: 'United States'
  },
  {
      id: '17',
      author: 'Yuki Tanaka',
      rating: 5,
      date: '2 months ago',
      title: 'Highly Recommended Service',
      content: 'Perfect for international businesses. The process was smooth even with our company being based in Japan.',
      verified: true,
      location: 'Japan'
  },
  {
      id: '18',
      author: 'Michael O\'Brien',
      rating: 4,
      date: '3 months ago',
      title: 'Great Business Solution',
      content: 'Streamlined our software procurement process significantly. The volume licensing options saved us considerable money.',
      verified: true,
      location: 'Ireland'
  },
  {
      id: '19',
      author: 'Charlotte Dubois',
      rating: 5,
      date: '3 months ago',
      title: 'Excellent Enterprise Support',
      content: 'The enterprise support team is knowledgeable and always available. They\'ve helped us optimize our software spending significantly.',
      verified: true,
      location: 'France'
  },
  {
      id: '20',
      author: 'Lars Svensson',
      rating: 5,
      date: '3 months ago',
      title: 'Trustworthy and Reliable',
      content: 'All licenses are genuine and the support is excellent. The pricing is very competitive and transparent.',
      verified: true,
      location: 'Sweden'
  },
  {
      id: '21',
      author: 'Elena Popov',
      rating: 4,
      date: '3 months ago',
      title: 'Fast and Efficient Service',
      content: 'Quick delivery and activation process. The customer support team is very responsive and helpful.',
      verified: true,
      location: 'Bulgaria'
  },
  {
      id: '22',
      author: 'William Chang',
      rating: 5,
      date: '3 months ago',
      title: 'Perfect for Our Business',
      content: 'The platform has everything we need for managing our software licenses. Great prices and excellent support.',
      verified: true,
      location: 'Hong Kong'
  },
  {
      id: '23',
      author: 'Sophia Müller',
      rating: 5,
      date: '4 months ago',
      title: 'Outstanding Experience',
      content: 'From purchase to implementation, everything was smooth. The support team is always there when needed.',
      verified: true,
      location: 'Germany'
  },
  {
      id: '24',
      author: 'Daniel Kim',
      rating: 4,
      date: '4 months ago',
      title: 'Great Value Service',
      content: 'Competitive prices and reliable service. The license management dashboard is particularly useful.',
      verified: true,
      location: 'South Korea'
  },
  {
      id: '25',
      author: 'Olivia Bennett',
      rating: 5,
      date: '4 months ago',
      title: 'Excellent Business Partner',
      content: 'They understand our business needs and provide excellent solutions. The cost savings have been significant.',
      verified: true,
      location: 'New Zealand'
  },
  {
      id: '26',
      author: 'Mohammed Al-Sayed',
      rating: 5,
      date: '4 months ago',
      title: 'Reliable Software Provider',
      content: 'Very professional service with competitive prices. The support team is knowledgeable and helpful.',
      verified: true,
      location: 'UAE'
  },
  {
      id: '27',
      author: 'Carlos Rodriguez',
      rating: 4,
      date: '4 months ago',
      title: 'Great Business Solution',
      content: 'Easy to use platform with good prices. The license activation process is quick and straightforward.',
      verified: true,
      location: 'Spain'
  },
  {
      id: '28',
      author: 'Nina Ivanova',
      rating: 5,
      date: '5 months ago',
      title: 'Exceptional Service',
      content: 'The support team goes above and beyond. They helped us find the perfect solution for our company.',
      verified: true,
      location: 'Russia'
  },
  {
      id: '29',
      author: 'Andrew MacLeod',
      rating: 5,
      date: '5 months ago',
      title: 'Highly Professional',
      content: 'Excellent service from start to finish. The platform is intuitive and the prices are very competitive.',
      verified: true,
      location: 'Scotland'
  },
  {
      id: '30',
      author: 'Julia Santos',
      rating: 4,
      date: '5 months ago',
      title: 'Very Satisfied',
      content: 'Good prices and reliable service. The license management tools are particularly helpful.',
      verified: true,
      location: 'Portugal'
  },
  {
      id: '31',
      author: 'Erik Johansson',
      rating: 5,
      date: '5 months ago',
      title: 'Outstanding Support',
      content: 'The customer service is exceptional. They helped us with every step of the licensing process.',
      verified: true,
      location: 'Sweden'
  },
  {
      id: '32',
      author: 'Rachel Cohen',
      rating: 5,
      date: '6 months ago',
      title: 'Great Business Tool',
      content: 'Makes managing software licenses so much easier. The savings on bulk purchases are substantial.',
      verified: true,
      location: 'Israel'
  },
  {
      id: '33',
      author: 'Marco Rossi',
      rating: 4,
      date: '6 months ago',
      title: 'Efficient and Reliable',
      content: 'Quick delivery and good prices. The platform is easy to navigate and use.',
      verified: true,
      location: 'Italy'
  },
  {
      id: '34',
      author: 'Aisha Patel',
      rating: 5,
      date: '6 months ago',
      title: 'Excellent Value',
      content: 'The pricing is very competitive and the service is reliable. Highly recommended for businesses.',
      verified: true,
      location: 'India'
  },
  {
      id: '35',
      author: 'Pierre Dubois',
      rating: 5,
      date: '6 months ago',
      title: 'Professional Service',
      content: 'Very satisfied with both the pricing and support. The license activation process is seamless.',
      verified: true,
      location: 'Belgium'
  },
  {
      id: '36',
      author: 'Linda Anderson',
      rating: 4,
      date: '6 months ago',
      title: 'Great Experience',
      content: 'Easy to use platform with competitive prices. Support team is always helpful when needed.',
      verified: true,
      location: 'Canada'
  },
  {
      id: '37',
      author: 'Hans Weber',
      rating: 5,
      date: '7 months ago',
      title: 'Reliable Partner',
      content: 'Consistent quality service and competitive pricing. The enterprise support is particularly impressive.',
      verified: true,
      location: 'Austria'
  },
  {
      id: '38',
      author: 'Ana Costa',
      rating: 5,
      date: '7 months ago',
      title: 'Excellent Platform',
      content: 'User-friendly interface and great prices. The customer support team is very knowledgeable.',
      verified: true,
      location: 'Brazil'
  },
  {
      id: '39',
      author: 'Kevin O\'Sullivan',
      rating: 4,
      date: '7 months ago',
      title: 'Very Good Service',
      content: 'Smooth experience from purchase to activation. The bulk licensing options are very cost-effective.',
      verified: true,
      location: 'Ireland'
  },
  {
      id: '40',
      author: 'Marie Jensen',
      rating: 5,
      date: '7 months ago',
      title: 'Top-Notch Service',
      content: 'Excellent support and competitive prices. The platform makes license management effortless.',
      verified: true,
      location: 'Denmark'
  }
  ];
  
  // Function to get random reviews
  export function getRandomReviews(count: number = 10): Review[] {
    const shuffled = [...reviews].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  