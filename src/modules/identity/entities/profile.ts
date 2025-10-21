import z from "zod";

const profileSchema = z.object({
  nickname: z.string().min(3).max(32),
  about: z.string().max(128).optional(),
  avatarUrl: z.url().optional(),
});

type ProfileType = z.infer<typeof profileSchema>;

export class Profile {
  private constructor(
    private nickname: string,
    private about?: string,
    private avatarUrl?: string,
  ) {}

  static create(value: ProfileType): Profile {
    const profile = profileSchema.parse(value);
    return new Profile(profile.nickname, profile.about, profile.avatarUrl);
  }

  public updateNickname(value: string): void {
    const { nickname } = profileSchema.pick({ nickname: true }).parse({ nickname: value });

    this.nickname = nickname;
  }

  public updateAbout(value?: string): void {
    const { about } = profileSchema.pick({ about: true }).parse({ about: value });

    this.about = about;
  }

  public updateAvatarUrl(value?: string): void {
    const { avatarUrl } = profileSchema.pick({ avatarUrl: true }).parse({ avatarUrl: value });

    this.avatarUrl = avatarUrl;
  }

  public toJSON(): ProfileType {
    return {
      nickname: this.nickname,
      about: this.about,
      avatarUrl: this.avatarUrl,
    };
  }
}
