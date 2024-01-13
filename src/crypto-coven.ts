import { Transfer as TransferEvent } from "../generated/CryptoCoven/CryptoCoven"
import { Token, User } from "../generated/schema"
import { ipfs, json } from "@graphprotocol/graph-ts"

const ipfshash = "QmaXzZhcYnsisuue5WRdQDH6FDvqkLQX1NckLqBYeYYEfm"

export function handleToken(event: TransferEvent): void {
  let token = Token.load(event.params.tokenId.toString())
  if (!token) {
    token = new Token(event.params.tokenId.toString())
    token.tokenId = event.params.tokenId

    token.tokenURI = "/" + event.params.tokenId.toString() + ".json"

    let metadata = ipfs.cat(ipfshash + token.tokenURI)
    if (metadata) {
      const value = json.fromBytes(metadata).toObject()
      if (value) {
        const name = value.get("name")
        const description = value.get("description")
        const image = value.get("image")
        const externalURL = value.get("external_url")

        if (name && description && image && externalURL) {
          token.name = name.toString()
          token.description = description.toString()
          token.image = image.toString()
          token.externalURL = externalURL.toString()
          token.ipfsURI = 'ipfs.io/ipfs/' + ipfshash + token.tokenURI
        }

        const coven = value.get("coven")
        if (coven) {
          let covenDate = coven.toObject()
          const type = covenDate.get("type")
          if (type) {
            token.type = type.toString()
          }

          const birthChart = covenDate.get("birthChart")
          if (birthChart) {
            let birthChartData = birthChart.toObject()
            const sun = birthChartData.get("sun")
            const moon = birthChartData.get("moon")
            const rising = birthChartData.get("rising")

            if (sun && moon && rising) {
              token.sun = sun.toString()
              token.moon = moon.toString()
              token.rising = rising.toString()
            }
          }
        }
      }
    }
  }

  token.updatedAtTimestamp = event.block.timestamp
  token.owner = event.params.to
  token.save()

  let user = User.load(event.params.to)
  if (!user) {
    user = new User(event.params.to)
    user.save()
  }
}