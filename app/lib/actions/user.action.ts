import { connectDB } from "../db";
import User from "../models/User";

type CreateUserInput = {
  clerkId: string;
  email: string;
  name: string;
  image?: string;
  avatar?: string;
};

export async function createUser(user: CreateUserInput) {
  try {
    await connectDB();
    const userData = await User.create({
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      avatar: user.avatar || user.image || "",
    });
    return userData;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteUser(id: string) {
  try {
    await connectDB();
    await User.deleteOne({ clerkId: id });
  } catch (error) {
    console.log(error);
  }
}
