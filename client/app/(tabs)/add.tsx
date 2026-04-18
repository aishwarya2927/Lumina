const saveCourse = async () => {
  try {
    const response = await fetch("http://10.10.62.123:5000/subjects", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, present: 0, total: 0 }),
    });

    if (response.ok) {
      alert("Course added successfully!");
      setName(''); // Clear the input
      router.back(); // Go back to the dashboard automatically
    }
  } catch (error) {
    alert("Backend not connected. Check Member 1's server!");
  }
};