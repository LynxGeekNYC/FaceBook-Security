const axios = require('axios');

const accessToken = 'YOUR_ACCESS_TOKEN';
const groupId = 'YOUR_GROUP_ID';
const postKeywords = ['keyword1', 'keyword2']; // Replace with your desired post keywords
const blockedKeywords = ['keyword3', 'keyword4']; // Replace with your desired blocked keywords

async function deletePosts() {
  try {
    // Retrieve all posts from the group
    const response = await axios.get(`https://graph.facebook.com/v12.0/${groupId}/feed?access_token=${accessToken}`);
    const { data } = response;

    // Filter posts based on keywords and delete them
    const postsToDelete = data.data.filter(post => {
      const postMessage = post.message.toLowerCase();
      return postKeywords.some(keyword => postMessage.includes(keyword.toLowerCase()));
    });

    for (const post of postsToDelete) {
      await axios.delete(`https://graph.facebook.com/v12.0/${post.id}?access_token=${accessToken}`);
      console.log(`Deleted post with ID: ${post.id}`);
    }

    console.log('All matching posts deleted successfully.');
  } catch (error) {
    console.error('An error occurred:', error.response.data);
  }
}

async function blockUsers() {
  try {
    // Retrieve member requests for the group
    const response = await axios.get(`https://graph.facebook.com/v12.0/${groupId}/member_requests?access_token=${accessToken}`);
    const { data } = response;

    // Filter member requests based on blocked keywords and block the users
    const usersToBlock = data.data.filter(member => {
      const profile = member.from;
      return blockedKeywords.some(keyword => {
        const profileText = `${profile.name} ${profile.about || ''}`.toLowerCase();
        return profileText.includes(keyword.toLowerCase());
      });
    });

    for (const user of usersToBlock) {
      await axios.post(`https://graph.facebook.com/v12.0/${groupId}/blocked?access_token=${accessToken}`, {
        user: user.from.id,
      });
      console.log(`Blocked user with ID: ${user.from.id}`);
    }

    console.log('All matching users blocked successfully.');
  } catch (error) {
    console.error('An error occurred:', error.response.data);
  }
}

async function main() {
  await deletePosts();
  await blockUsers();
}

main();
