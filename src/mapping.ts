import { BigInt, store, log } from "@graphprotocol/graph-ts";
import {
  ProfileGraph,
  Approval,
  ApprovalForAll,
  Follow,
  NewProfile,
  OwnershipTransferred,
  Transfer,
  Unfollow,
  SetAvatar
} from "../generated/ProfileGraph/ProfileGraph";

import { Profile, User, Follower } from "../generated/schema";

// export function handleApproval(event: Approval): void {
//   // Entities can be loaded from the store using a string ID; this ID
//   // needs to be unique across all entities of the same type
//   let entity = ExampleEntity.load(event.transaction.from.toHex())

//   // Entities only exist after they have been saved to the store;
//   // `null` checks allow to create entities on demand
//   if (!entity) {
//     entity = new ExampleEntity(event.transaction.from.toHex())

//     // Entity fields can be set using simple assignments
//     entity.count = BigInt.fromI32(0)
//   }

//   // BigInt and BigDecimal math are supported
//   entity.count = entity.count + BigInt.fromI32(1)

//   // Entity fields can be set based on event parameters
//   entity.owner = event.params.owner
//   entity.approved = event.params.approved

//   // Entities can be written to the store with `.save()`
//   entity.save()

//   // Note: If a handler doesn't require existing field values, it is faster
//   // _not_ to load the entity from the store. Instead, create it fresh with
//   // `new Entity(...)`, set the fields that should be updated and save the
//   // entity back to the store. Fields that were not set or unset remain
//   // unchanged, allowing for partial updates to be applied.

//   // It is also possible to access smart contracts from mappings. For
//   // example, the contract that has emitted the event can be connected to
//   // with:
//   //
//   // let contract = Contract.bind(event.address)
//   //
//   // The following functions can then be called on this contract to access
//   // state variables and other data:
//   //
//   // - contract._tokenIds(...)
//   // - contract.balanceOf(...)
//   // - contract.getApproved(...)
//   // - contract.isApprovedForAll(...)
//   // - contract.mint(...)
//   // - contract.name(...)
//   // - contract.owner(...)
//   // - contract.ownerOf(...)
//   // - contract.supportsInterface(...)
//   // - contract.symbol(...)
//   // - contract.tokenURI(...)
// }

export function handleNewProfile(event: NewProfile): void {
  let token = Profile.load(event.params.tokenId.toString());
  if (!token) {
    token = new Profile(event.params.tokenId.toString());
    token.creator = event.params.owner.toHexString();
    token.tokenID = event.params.tokenId;
    let tokenContract = ProfileGraph.bind(event.address);
    let callResult = tokenContract.try_tokenURI(event.params.tokenId);
    if (callResult.reverted) {
      log.info('tokenURI reverted', [])
    } else {
      token.contentURI = callResult.value
    }
  }
  token.owner = event.params.owner.toHexString();
  token.save();
  let user = User.load(event.params.owner.toHexString());
  if (!user) {
    user = new User(event.params.owner.toHexString());
    user.save();
  }
}

export function handleTransfer(event: Transfer): void {
  let token = Profile.load(event.params.tokenId.toString());
  if (token) {
    token.owner = event.params.to.toHexString();
    token.save();
  }
  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.save();
  }
}

export function handleFollow(event: Follow): void {
  let follower_id = event.params.follower.toString() + '.' + event.params.followed.toString();
  let follower = new Follower(follower_id);
  follower.tokenID = event.params.follower;
  follower.following = event.params.followed.toString();
  follower.save();
}

export function handleUnfollow(event: Unfollow): void {
  let follower_id = event.params.follower.toString() + '.' + event.params.unfollowed.toString();
  store.remove("Follower", follower_id);
}

export function handleSetAvatar(event: SetAvatar): void {
  let token = Profile.load(event.params.tokenId.toString());
  if (token) {
    token.contentURI = event.params.avatarURI;
    token.save();
  }
}
