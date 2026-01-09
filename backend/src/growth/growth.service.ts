import { Injectable } from '@nestjs/common';
import { ReferralService } from './services/referral.service';

@Injectable()
export class GrowthService {
  constructor(private readonly referralService: ReferralService) {}

  async createReferralCode(userId: string) {
    return this.referralService.createReferralCode(userId);
  }

  async getReferralCode(userId: string) {
    return this.referralService.getReferralCode(userId);
  }

  async applyReferralCode(userId: string, code: string) {
    return this.referralService.applyReferralCode(userId, code);
  }

  async convertReferral(userId: string) {
    return this.referralService.convertReferral(userId);
  }

  async getReferralStats(userId: string) {
    return this.referralService.getReferralStats(userId);
  }

  async getTopReferrers(limit?: number) {
    return this.referralService.getTopReferrers(limit);
  }

  generateShareMessage(code: string): string {
    return `🚀 Experimente a FragTech e ganhe R$20! Use meu código ${code} no cadastro. Sua jornada financeira começa aqui: https://fragtech.app/signup?ref=${code}`;
  }

  generateShareLinks(code: string) {
    const message = encodeURIComponent(this.generateShareMessage(code));
    const url = encodeURIComponent(`https://fragtech.app/signup?ref=${code}`);

    return {
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${url}&text=${message}`,
      twitter: `https://twitter.com/intent/tweet?text=${message}`,
      copy: `https://fragtech.app/signup?ref=${code}`,
    };
  }
}
