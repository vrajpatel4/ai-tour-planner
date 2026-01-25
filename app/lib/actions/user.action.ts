import { connectDB } from "../db";
import User from "../models/User";

export async function createUser(user: any) {
  try {
    await connectDB();
    const userData = await User.create({
      clerkId: user.id,
      email: user.email,
      name: `${user.first_name ?? ""} ${user.last_name ?? ""}`,
      image: user.image_url,
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
