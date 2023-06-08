// Automating the deletion of Facebook posts and comments, as well as banning users based on keywords, requires interactions with the Facebook Graph API.
// You will need to create a CRON Job to run this script every 30 seconds. Preferably less. 

const axios = require('axios');

const accessToken = 'YOUR_ACCESS_TOKEN';
const groupId = 'YOUR_GROUP_ID';
const postKeywords = ['keyword1', 'keyword2']; // Replace with your desired post keywords
const commentKeywords = ['keyword3', 'keyword4']; // Replace with your desired comment keywords
const blockedUserKeywords = ['blocked1', 'blocked2']; // Replace with keywords to block users
const blockedProfileKeywords = ['blocked3', 'blocked4']; // Replace with keywords to block profiles

async function deletePost(postId) {
  try {
    await axios.delete(`https://graph.facebook.com/v12.0/${postId}?access_token=${accessToken}`);
    console.log(`Deleted post with ID: ${postId}`);
  } catch (error) {
    console.error(`Error deleting post with ID: ${postId}`, error.response.data);
  }
}

async function deleteComment(commentId) {
  try {
    await axios.delete(`https://graph.facebook.com/v12.0/${commentId}?access_token=${accessToken}`);
    console.log(`Deleted comment with ID: ${commentId}`);
  } catch (error) {
    console.error(`Error deleting comment with ID: ${commentId}`, error.response.data);
  }
}

async function banUser(userId) {
  try {
    await axios.post(`https://graph.facebook.com/v12.0/${groupId}/banned?access_token=${accessToken}`, {
      user: userId,
    });
    console.log(`Banned user with ID: ${userId}`);
  } catch (error) {
    console.error(`Error banning user with ID: ${userId}`, error.response.data);
  }
}

async function handlePost(post) {
  const postMessage = post.message.toLowerCase();
  if (postKeywords.some(keyword => postMessage.includes(keyword.toLowerCase()))) {
    await deletePost(post.id);
    await banUser(post.from.id);
  }

  if (post.comments && post.comments.data.length > 0) {
    for (const comment of post.comments.data) {
      const commentMessage = comment.message.toLowerCase();
      if (commentKeywords.some(keyword => commentMessage.includes(keyword.toLowerCase()))) {
        await deleteComment(comment.id);
        await banUser(comment.from.id);
      }
    }
  }
}

async function handleMemberRequest(member) {
  const profile = member.from;
  const profileText = `${profile.name} ${profile.about || ''}`.toLowerCase();
  if (blockedProfileKeywords.some(keyword => profileText.includes(keyword.toLowerCase()))) {
    await axios.delete(`https://graph.facebook.com/v12.0/${groupId}/members?access_token=${accessToken}&member=${profile.id}`);
    console.log(`Declined membership request from user with ID: ${profile.id}`);
  }
}

async function handleMemberRequests() {
  try {
    const response = await axios.get(`https://graph.facebook.com/v12.0/${groupId}/member_requests?access_token=${accessToken}`);
    const { data } = response;

    for (const member of data.data) {
      await handleMemberRequest(member);
    }
  } catch (error) {
    console.error('An error occurred while retrieving member requests:', error.response.data);
  }
}

async function handleGroupFeed() {
  try {
    const response = await axios.get(`https://graph.facebook.com/v12.0/${groupId}/feed?access_token=${accessToken}`);
    const { data } = response;

    for (const post of data.data) {
      await handlePost(post);
    }
  } catch (error) {
    console.error('An error occurred while retrieving group feed:', error.response.data);
  }
}

async function main() {
  await handleGroupFeed();
  await handleMemberRequests();
}

main();
