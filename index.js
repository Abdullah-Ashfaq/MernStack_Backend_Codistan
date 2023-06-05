const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

// Define the API endpoints
app.use(cors());
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Codistan API');
});

function getData() {
  const parentData = JSON.parse(fs.readFileSync('Parent.json', 'utf-8'));
  const childData = JSON.parse(fs.readFileSync('Child.json', 'utf-8'));

  const parentArray = Array.isArray(parentData.data) ? parentData.data : [parentData.data];
  const childArray = Array.isArray(childData.data) ? childData.data : [childData.data];

  parentArray.forEach(parent => {
    parent.totalPaidAmount = childArray
      .filter(child => child.parentId === parent.id)
      .reduce((total, child) => total + child.paidAmount, 0);
  });

  return parentArray;
}

app.get('/api/transactions', (req, res) => {
  const { page = 1, pageSize = 2, sortBy = 'id' } = req.query;
  const data = getData();

  data.sort((a, b) => {
    if (sortBy === 'id') {
      return a.id - b.id;
    }
  });

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = data.slice(startIndex, endIndex);

  res.json(paginatedData);
});

app.get('/api/child', (req, res) => {
  const childData = JSON.parse(fs.readFileSync('Child.json', 'utf-8'));
  const parentData = JSON.parse(fs.readFileSync('Parent.json', 'utf-8'));

  const childArray = Array.isArray(childData.data) ? childData.data : [childData.data];

  // Map child data with corresponding parent transaction
  const mappedChildData = childArray.map(child => {
    const parentTransaction = parentData.data.find(parent => parent.id === child.parentId);
    return {
      childId: child.id,
      sender: parentTransaction.sender,
      receiver: parentTransaction.receiver,
      totalAmount: parentTransaction.totalAmount,
      paidAmount: child.paidAmount
    };
  });

  res.json(mappedChildData);
});

// Start the server
app.listen(4000, () => console.log('Server started on port 4000'));
