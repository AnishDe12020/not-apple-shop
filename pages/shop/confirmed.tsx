import 'react-circular-progressbar/dist/styles.css'
import BackLink from '../../components/BackLink'
import Confirmed from '../../components/Confirmed'
import PageHeading from '../../components/PageHeading'

export default function ConfirmedPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/shop">Spend more money</BackLink>

      <PageHeading>Thank you, enjoy the 🍎 ecosystem!</PageHeading>

      <div className="h-80 w-80">
        <Confirmed />
      </div>
    </div>
  )
}
