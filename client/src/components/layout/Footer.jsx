import React from 'react';
import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface-container w-full rounded-t-[40px] mt-24 border-t border-outline-variant/30">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto">
        {/* Brand & Mission Column */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
          <span className="font-display font-bold text-2xl uppercase tracking-tight text-primary">
            {t('common.appName')}
          </span>
          <p className="text-sm text-secondary font-medium max-w-xs">
            {t('footer.brandQuote')}
          </p>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            {t('footer.missionText')}
          </p>
        </div>

        {/* Link Columns */}
        <div className="col-span-1 md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              {t('footer.ecosystemTitle')}
            </h4>
            <Link to="/marketplace" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.b2cMarketplace')}
            </Link>
            <Link to="/marketplace?type=b2b" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.b2bProcurement')}
            </Link>
            <Link to="/market-prices" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.mandiIndexing')}
            </Link>
            <Link to="/weather" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.agroMeteorology')}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              {t('footer.technologyTitle')}
            </h4>
            <Link to="/ai-assistant" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.khetiAiAdvisor')}
            </Link>
            <Link to="/farmer/batches" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.qualityAssessment')}
            </Link>
            <Link to="/farmer/market" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.smartMarketRecommender')}
            </Link>
            <Link to="/marketplace" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              {t('footer.batchTraceability')}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              {t('footer.trustTitle')}
            </h4>
            <span className="text-xs text-on-surface-variant">{t('footer.owaspSecurity')}</span>
            <span className="text-xs text-on-surface-variant">{t('footer.argonVault')}</span>
            <span className="text-xs text-on-surface-variant">{t('footer.traceableProduce')}</span>
            <span className="text-xs text-on-surface-variant">{t('footer.auditTrails')}</span>
          </div>

          {/* Local Conditions Widget */}
          <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              {t('footer.localConditionsTitle')}
            </p>
            <div className="bg-surface-container-high rounded-[16px] p-3.5 flex items-center gap-3 border border-outline-variant/30">
              <Sun className="w-7 h-7 text-amber-600 shrink-0" />
              <div>
                <span className="font-display font-bold text-xl text-primary block leading-none mb-1">
                  28°C
                </span>
                <span className="text-[11px] font-medium text-on-surface-variant block">
                  {t('footer.puneConditions')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        <p>{t('footer.copyright')}</p>
        <p className="font-mono text-[11px]">{t('footer.systemStatus')}</p>
      </div>
    </footer>
  );
};

export default Footer;
